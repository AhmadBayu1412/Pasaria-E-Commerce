/**
 * Brute Force Protection - Step 9.5
 *
 * Dual-dimension tracking:
 * 1. IP-based rate limit (mencegah satu IP mencoba banyak email)
 * 2. Email-based failure tracker (mencegah satu email dibruteforce)
 *
 * Keduanya saling melengkapi
 */

import type { Request, Response, NextFunction } from "express"
import { redis } from "../../infra/cache/redis"

// =============== KONFIGURASI ===============

export const BRUTE_FORCE_CONFIG = {
    /** 5 percobaan gagal sebelum lockout */
    maxAttempts: 5,
    /** Lockout duration dalam detik */
    lockoutDuration: 15 * 60,
    /** Window untuk menghitung attempts dalam detik */
    windowSeconds: 15 * 60,
    /** Key prefixes */
    prefixes: {
        ip: "bf:ip:",
        email: "bf:email:",
        lockout: "bf:lockout:"
    }
} as const

// =============== TYPE ===============

interface BruteForceResult {
    blocked: boolean
    attemptsRemaining: number
    lockoutRemaining?: number
}

// =============== IMPLEMENTASI ===============

/**
 * Get IP dari request
 */
function getClientIp(req: Request): string {
    return req.ip || req.socket.remoteAddress || "unknown"
}

/**
 * Check brute force status
 * Cek keduanya: IP dan Email
 */
export async function checkBruteForce(
    ip: string,
    email: string
): Promise<BruteForceResult> {
    try {
        if (!redis.isReady) {
            return { blocked: false, attemptsRemaining: BRUTE_FORCE_CONFIG.maxAttempts }
        }

        // Check IP lockout
        const ipLockoutKey = `${BRUTE_FORCE_CONFIG.prefixes.lockout}ip:${ip}`
        const ipLockout = await redis.get(ipLockoutKey)

        if (ipLockout) {
            const remaining = Math.ceil((Number(ipLockout) - Date.now()) / 1000)
            if (remaining > 0) {
                return {
                    blocked: true,
                    attemptsRemaining: 0,
                    lockoutRemaining: remaining
                }
            }
            await redis.del(ipLockoutKey)
        }

        // Check email lockout
        const emailKey = `${BRUTE_FORCE_CONFIG.prefixes.email}${email.toLowerCase()}`
        const attempts = await redis.get(emailKey)

        if (attempts) {
            const failedCount = Number(attempts)

            if (failedCount >= BRUTE_FORCE_CONFIG.maxAttempts) {
                // Set email lockout
                const lockoutUntil = Date.now() + (BRUTE_FORCE_CONFIG.lockoutDuration * 1000)
                await redis.set(
                    `${BRUTE_FORCE_CONFIG.prefixes.lockout}email:${email.toLowerCase()}`,
                    lockoutUntil.toString(),
                    { EX: BRUTE_FORCE_CONFIG.lockoutDuration }
                )
                await redis.del(emailKey)

                return {
                    blocked: true,
                    attemptsRemaining: 0,
                    lockoutRemaining: BRUTE_FORCE_CONFIG.lockoutDuration
                }
            }

            return {
                blocked: false,
                attemptsRemaining: BRUTE_FORCE_CONFIG.maxAttempts - failedCount
            }
        }

        return { blocked: false, attemptsRemaining: BRUTE_FORCE_CONFIG.maxAttempts }
    } catch {
        return { blocked: false, attemptsRemaining: BRUTE_FORCE_CONFIG.maxAttempts }
    }
}

/**
 * Record failed login attempt
 * Increment both IP and Email counters
 */
export async function recordFailedAttempt(
    ip: string,
    email: string
): Promise<void> {
    try {
        if (!redis.isReady) return

        const normalizedEmail = email.toLowerCase()

        // IP counter
        const ipKey = `${BRUTE_FORCE_CONFIG.prefixes.ip}${ip}`
        const ipExists = await redis.exists(ipKey)

        if (ipExists) {
            await redis.incr(ipKey)
        } else {
            await redis.set(ipKey, "1", { EX: BRUTE_FORCE_CONFIG.windowSeconds })
        }

        // Email counter
        const emailKey = `${BRUTE_FORCE_CONFIG.prefixes.email}${normalizedEmail}`
        const emailExists = await redis.exists(emailKey)

        if (emailExists) {
            await redis.incr(emailKey)
        } else {
            await redis.set(emailKey, "1", { EX: BRUTE_FORCE_CONFIG.windowSeconds })
        }

        // Check if IP exceeded threshold -> temporary IP lockout
        const ipCount = await redis.get(ipKey)
        if (ipCount && Number(ipCount) >= BRUTE_FORCE_CONFIG.maxAttempts * 2) {
            const lockoutUntil = Date.now() + (BRUTE_FORCE_CONFIG.lockoutDuration * 1000)
            await redis.set(
                `${BRUTE_FORCE_CONFIG.prefixes.lockout}ip:${ip}`,
                lockoutUntil.toString(),
                { EX: BRUTE_FORCE_CONFIG.lockoutDuration }
            )
        }
    } catch {
        // Silent fail
    }
}

/**
 * Clear failed attempts on successful login
 */
export async function clearFailedAttempts(
    ip: string,
    email: string
): Promise<void> {
    try {
        if (!redis.isReady) return

        const normalizedEmail = email.toLowerCase()

        await redis.del(`${BRUTE_FORCE_CONFIG.prefixes.ip}${ip}`)
        await redis.del(`${BRUTE_FORCE_CONFIG.prefixes.email}${normalizedEmail}`)
        await redis.del(`${BRUTE_FORCE_CONFIG.prefixes.lockout}ip:${ip}`)
        await redis.del(`${BRUTE_FORCE_CONFIG.prefixes.lockout}email:${normalizedEmail}`)
    } catch {
        // Silent fail
    }
}

/**
 * Brute force middleware untuk login endpoint
 */
export function bruteForceProtect(
    getEmail: (req: Request) => string
) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const ip = getClientIp(req)
        const email = getEmail(req)

        const result = await checkBruteForce(ip, email)

        res.setHeader("X-Attempts-Remaining", result.attemptsRemaining)

        if (result.blocked) {
            res.status(429).json({
                error: {
                    code: "ACCOUNT_LOCKED",
                    message: "Terlalu banyak percobaan login gagal"
                }
            })
            return
        }

        next()
    }
}

/**
 * Helper untuk export getClientIp (untuk auth.service)
 */
export function getIpFromRequest(req: Request): string {
    return getClientIp(req)
}