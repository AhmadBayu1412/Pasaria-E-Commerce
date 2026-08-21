/**
 * Security Constants - Step 9.2
 *
 * SATU-SATUNYA sumber truth untuk cookie configuration.
 * Semua modul (session, csrf, dll) import dari sini.
 */

export const SECURITY_COOKIE_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    domain: process.env.SESSION_COOKIE_DOMAIN || undefined
} as const

/**
 * CSRF Cookie - frontend perlu baca token
 * Tapi tetap menggunakan pattern yang aman
 */
export const CSRF_COOKIE_CONFIG = {
    httpOnly: false, // Frontend perlu baca
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const, // CSRF protection max
    path: "/"
} as const

/**
 * CSRF Header name
 */
export const CSRF_HEADER_NAME = "x-csrf-token" as const

/**
 * Rate limit headers
 */
export const RATE_LIMIT_HEADERS = {
    limit: "X-RateLimit-Limit",
    remaining: "X-RateLimit-Remaining",
    reset: "X-RateLimit-Reset"
} as const