/**
 * HTTP Security Headers - Step 9.1
 *
 * Konfigurasi helmet untuk arsitektur Pasaria:
 * - Mendukung cookie-based session
 * - Tidak mengganggu frontend integration
 * - Production-ready defaults
 *
 * Reference: https://helmetjs.github.io/
 */

import helmet from "helmet"

/**
 * Generate helmet middleware
 * Dipakai di app.ts
 */
export function helmetMiddleware() {
    return helmet({
        // ========== CLICKJACKING PROTECTION ==========
        /**
         * X-Frame-Options: DENY
         * Mencegah halaman di-embed dalam iframe
         */
        frameguard: {
            action: "deny"
        },

        // ========== MIME SNIFFING PROTECTION ==========
        /**
         * X-Content-Type-Options: nosniff
         */
        noSniff: true,

        // ========== REFERRER POLICY ==========
        /**
         * Referrer-Policy: strict-origin-when-cross-origin
         */
        referrerPolicy: {
            policy: "strict-origin-when-cross-origin"
        },

        // ========== HSTS (HTTP STRICT TRANSPORT SECURITY) ==========
        /**
         * Strict-Transport-Security
         * Hanya aktif di production dengan HTTPS
         */
        hsts: process.env.NODE_ENV === "production" ? {
            maxAge: 60 * 60 * 24 * 365, // 1 tahun
            includeSubDomains: true,
            preload: true
        } : false,

        // ========== CROSS-ORIGIN POLICIES ==========
        /**
         * Cross-Origin-Resource-Policy: same-site
         * Allow cross-origin fonts/images yang umum dipakai frontend
         */
        crossOriginResourcePolicy: {
            policy: "same-site"
        },

        /**
         * Cross-Origin-Opener-Policy
         * same-origin-allow-popups - untuk payment gateway integration
         */
        crossOriginOpenerPolicy: {
            policy: "same-origin-allow-popups"
        },

        /**
         * Matikan legacy XSS filter (gunakan CSP instead jika diperlukan)
         */
        xssFilter: false,

        /**
         * Matikan COEP (untuk sharedArrayBuffer compatibility)
         */
        crossOriginEmbedderPolicy: false
    })
}