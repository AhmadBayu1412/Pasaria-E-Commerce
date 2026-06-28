// Standardized authentication error constants
// Dipakai oleh semua auth-related code

import { BusinessError } from "../../errors/business.error.js"

/**
 * Error codes untuk authentication
 */
export const AUTH_ERROR_CODES = {
    SESSION_NOT_FOUND: "AUTH_SESSION_NOT_FOUND",
    USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
    USER_INACTIVE: "AUTH_USER_INACTIVE",
    INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
    ACCESS_DENIED: "AUTH_ACCESS_DENIED",
    AUTH_REQUIRED: "AUTH_REQUIRED"
} as const

/**
 * Pre-defined errors untuk authentication
 */
export const AUTH_ERRORS = {
    // 401 - Authentication errors
    sessionNotFound: new BusinessError(
        "Session expired. Silakan login kembali.",
        401,
        "SESSION_NOT_FOUND"
    ),

    userNotFound: new BusinessError(
        "Akun tidak ditemukan.",
        401,
        "USER_NOT_FOUND"
    ),

    invalidCredentials: new BusinessError(
        "Email atau password salah.",
        401,
        "INVALID_CREDENTIALS"
    ),

    authRequired: new BusinessError(
        "Silakan login terlebih dahulu.",
        401,
        "AUTH_REQUIRED"
    ),

    // 403 - Authorization errors
    userInactive: new BusinessError(
        "Akun non-aktif. Hubungi support.",
        403,
        "USER_INACTIVE"
    ),

    accessDenied: new BusinessError(
        "Anda tidak memiliki akses ke endpoint ini.",
        403,
        "ACCESS_DENIED"
    ),

    // 429 - Rate limiting errors
    tooManyAttempts: new BusinessError(
        "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
        429,
        "ACCOUNT_LOCKED"
    ),

    rateLimited: new BusinessError(
        "Terlalu banyak request. Silakan coba lagi nanti.",
        429,
        "RATE_LIMIT_EXCEEDED"
    )
} as const

/**
 * Helper untuk membuat access denied dengan role info
 */
export function accessDeniedForRole(role: string): BusinessError {
    return new BusinessError(
        `Role "${role}" tidak memiliki akses ke endpoint ini.`,
        403
    )
}