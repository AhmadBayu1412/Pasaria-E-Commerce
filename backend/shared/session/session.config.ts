/**
 * Session Configuration
 * Semua bisa diubah via environent variables
 * Tidak ada harcoded values
 */
export const SESSION_CONFIG = {
    // Nama cookie
    cookieName: process.env.SESSION_COOKIE_NAME || "sessionId",

    /**
     * Session TTL dalam detik
     * Default: 24 jam
     * Usage: SESSION_TTL=86400 di .env
     */
    ttl: Number(process.env.SESSION_TTL) || 60 * 60 * 24,

    /**
     * Cookie options - aman dan production-ready
     */
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
        path: "/",
        domain: process.env.SESSION_COOKIE_DOMAIN || undefined
    }
} as const