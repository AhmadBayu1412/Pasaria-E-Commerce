/**
 * CSRF Protection - Step 9.3
 *
 * Menggunakan Synchronizer Token Pattern
 * Karena session sudah disimpan di Redis, CSRF token juga di Redis
 *
 * Flow:
 * 1. Login/Register berhasil -> generate token -> simpan di Redis -> set cookie
 * 2. Request mutation -> validasi token dari header vs Redis
 * 3. Logout -> hapus token dari Redis
 */

import type { Request, Response, NextFunction } from "express"
import { redis } from "../../infra/cache/redis.js"
import { SESSION_CONFIG } from "../session/session.config.js"
import { CSRF_COOKIE_CONFIG, CSRF_HEADER_NAME } from "./security.constants.js"
import { BusinessError } from "../errors/business.error.js"

/**
 * CSRF-specific errors
 */
const CSRF_ERRORS = {
    tokenMissing: new BusinessError("Forbidden", 403, "CSRF_TOKEN_MISSING"),
    tokenInvalid: new BusinessError("Forbidden", 403, "CSRF_TOKEN_INVALID"),
    validationFailed: new BusinessError("Forbidden", 403, "CSRF_VALIDATION_FAILED")
} as const

const CSRF_TOKEN_PREFIX = "csrf:" as const

/**
 * Generate CSRF token
 * Pure function - generate saja, tidak simpan
 */
export function generateCsrfToken(): string {
    const randomPart = crypto.randomUUID().replace(/-/g, "")
    const timestamp = Date.now().toString(36)
    return `${randomPart}.${timestamp}`
}

/**
 * Simpan CSRF token ke Redis
 * Dipanggil setelah login/register berhasil
 */
export async function storeCsrfToken(
    sessionId: string,
    token: string
): Promise<void> {
    if (!redis.isReady) return

    await redis.set(
        `${CSRF_TOKEN_PREFIX}${sessionId}`,
        token,
        { EX: SESSION_CONFIG.ttl }
    )
}

/**
 * Hapus CSRF token dari Redis
 * Dipanggil saat logout
 */
export async function deleteCsrfToken(sessionId: string): Promise<void> {
    if (!redis.isReady) return
    await redis.del(`${CSRF_TOKEN_PREFIX}${sessionId}`)
}

/**
 * Set CSRF cookie
 * Dipanggil setelah login/register berhasil
 */
export function setCsrfCookie(
    res: Response,
    token: string
): void {
    res.cookie("csrfToken", token, CSRF_COOKIE_CONFIG)
}

/**
 * Clear CSRF cookie
 * Dipanggil saat logout
 */
export function clearCsrfCookie(res: Response): void {
    res.clearCookie("csrfToken", {
        ...CSRF_COOKIE_CONFIG,
        maxAge: 0
    })
}

/**
 * CSRF Validation Middleware
 * Dipakai untuk endpoint yang memodifikasi data
 */
export function validateCsrf(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    // Skip untuk GET, HEAD, OPTIONS
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next()
    }

    const sessionId = req.cookies?.[SESSION_CONFIG.cookieName]

    // Skip jika tidak ada session (public endpoint)
    if (!sessionId) {
        return next()
    }

    const clientToken = req.headers[CSRF_HEADER_NAME] as string | undefined

    if (!clientToken) {
        // Error generic untuk production - jangan bocorkan detail
        return next(CSRF_ERRORS.tokenMissing)
    }

    // Async validation
    validateToken(sessionId, clientToken)
        .then(isValid => {
            if (!isValid) {
                return next(CSRF_ERRORS.tokenInvalid)
            }
            next()
        })
        .catch(() => {
            return next(CSRF_ERRORS.validationFailed)
        })
}

/**
 * Internal token validation
 */
async function validateToken(
    sessionId: string,
    clientToken: string
): Promise<boolean> {
    if (!clientToken || !sessionId) {
        return false
    }

    try {
        const storedToken = await redis.get(
            `${CSRF_TOKEN_PREFIX}${sessionId}`
        )

        if (!storedToken) {
            return false
        }

        // Timing-safe comparison
        return storedToken === clientToken
    } catch {
        return false
    }
}