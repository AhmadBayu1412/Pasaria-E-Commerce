/**
 * Rate Limiting - Step 9.4
 *
 * Middleware factory untuk dipasang per-route
 * Usage:
 *   router.post("/login", rateLimit("login"), loginController)
 *   router.post("/register", rateLimit("register"), registerController)
 */

import type { Request, Response, NextFunction } from "express"
import { redis } from "../../infra/cache/redis"
import { RATE_LIMIT_HEADERS } from "./security.constants"

// =============== KONFIGURASI ===============

export const RATE_LIMIT_CONFIG = {
    login: {
        max: 5,
        windowMs: 15 * 60 * 1000, // 15 menit
        keyPrefix: "rl:login:"
    },
    register: {
        max: 3,
        windowMs: 60 * 60 * 1000, // 60 menit
        keyPrefix: "rl:register:"
    }
} as const

// =============== TYPE ===============

interface RateLimitResult {
    allowed: boolean
    remaining: number
    reset: number
}

// =============== IMPLEMENTASI ===============

/**
 * Check rate limit dengan sliding window
 */
async function checkRateLimit(
    key: string,
    max: number,
    windowMs: number
): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - windowMs

    try {
        if (!redis.isReady) {
            return { allowed: true, remaining: max - 1, reset: now + windowMs }
        }

        // Remove expired entries
        await redis.zRemRangeByScore(key, 0, windowStart)

        // Count current requests
        const count = await redis.zCard(key)

        if (count >= max) {
            const oldest = await redis.zRange(key, 0, 0, { REV: false })
            const reset = oldest.length > 0
                ? Number(oldest[0]) + windowMs
                : now + windowMs

            return { allowed: false, remaining: 0, reset }
        }

        // Add new request
        await redis.zAdd(key, { score: now, value: now.toString() })
        await redis.expire(key, Math.ceil(windowMs / 1000))

        return {
            allowed: true,
            remaining: max - count - 1,
            reset: now + windowMs
        }
    } catch {
        return { allowed: true, remaining: max - 1, reset: now + windowMs }
    }
}

/**
 * Rate limit middleware factory
 * Dipasang per-route, bukan per-prefix
 */
export function rateLimit(type: keyof typeof RATE_LIMIT_CONFIG) {
    const config = RATE_LIMIT_CONFIG[type]

    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        // IP-based key (perlu trust proxy di app.ts)
        const ip = req.ip || "unknown"
        const key = `${config.keyPrefix}${ip}`

        const result = await checkRateLimit(key, config.max, config.windowMs)

        // Set standard headers
        res.setHeader(RATE_LIMIT_HEADERS.limit, config.max)
        res.setHeader(RATE_LIMIT_HEADERS.remaining, result.remaining)
        res.setHeader(RATE_LIMIT_HEADERS.reset, Math.ceil(result.reset / 1000))

        if (!result.allowed) {
            res.setHeader("Retry-After", Math.ceil((result.reset - Date.now()) / 1000))

            // Error generic untuk production
            res.status(429).json({
                error: {
                    code: "RATE_LIMIT_EXCEEDED",
                    message: "Terlalu banyak request"
                }
            })
            return
        }

        next()
    }
}