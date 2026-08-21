/**
 * Environment Validation - Step 9.7
 *
 * Prinsip: Fail Fast
 * Aplikasi tidak boleh berjalan dalam kondisi tidak aman
 */

const REQUIRED_ENV_VARS = [
    "SESSION_SECRET",
    "SESSION_COOKIE_NAME",
    "REDIS_URL",
    "DATABASE_URL"
] as const

const REQUIRED_IN_PRODUCTION = [
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
] as const

interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const isProduction = process.env.NODE_ENV === "production"

    // ========== CHECK REQUIRED VARS ==========
    for (const varName of REQUIRED_ENV_VARS) {
        const value = process.env[varName]

        if (!value || value.trim() === "") {
            errors.push(`${varName} is required but not set`)
        }
    }

    // ========== CHECK PRODUCTION-ONLY REQUIRED VARS ==========
    if (isProduction) {
        for (const varName of REQUIRED_IN_PRODUCTION) {
            const value = process.env[varName]
            if (!value || value.trim() === "") {
                errors.push(`${varName} is required in production but not set`)
            }
        }
    } else {
        for (const varName of REQUIRED_IN_PRODUCTION) {
            if (!process.env[varName]) {
                warnings.push(`${varName} not set — file uploads will not work`)
            }
        }
    }

    // ========== SESSION_SECRET MINIMUM LENGTH ==========
    const sessionSecret = process.env.SESSION_SECRET
    if (sessionSecret && sessionSecret.length < 32) {
        errors.push("SESSION_SECRET harus minimal 32 karakter")
    }

    // ========== REDIS URL VALIDATION ==========
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
        try {
            new URL(redisUrl)
        } catch {
            errors.push("REDIS_URL format tidak valid")
        }
    }

    // ========== SESSION COOKIE NAME DEFAULT CHECK ==========
    const cookieName = process.env.SESSION_COOKIE_NAME

    // DI PRODUCTION: default = ERROR
    if (isProduction) {
        if (!cookieName || cookieName === "sessionId") {
            errors.push("SESSION_COOKIE_NAME tidak boleh menggunakan nilai default di production")
        }
    }
    // DI DEVELOPMENT: default = WARNING
    else {
        if (cookieName === "sessionId") {
            warnings.push("SESSION_COOKIE_NAME menggunakan nilai default. Harap ubah di production!")
        }
    }

    // ========== SESSION TTL VALIDATION ==========
    const sessionTtl = process.env.SESSION_TTL
    if (sessionTtl) {
        const num = Number(sessionTtl)
        if (isNaN(num) || num <= 0 || num > 60 * 60 * 24 * 30) {
            errors.push("SESSION_TTL harus angka positif (detik), maks 30 hari")
        }
    }

    // ========== PORT VALIDATION ==========
    const port = process.env.PORT
    if (port) {
        const num = Number(port)
        if (isNaN(num) || num <= 0 || num > 65535) {
            errors.push("PORT harus angka antara 1-65535")
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Validate environment dan throw error jika invalid
 * Dipanggil di bootstrap()
 */
export function assertEnvironment(): void {
    const result = validateEnvironment()

    if (result.warnings.length > 0) {
        console.warn("⚠️  SECURITY WARNINGS:")
        result.warnings.forEach(w => console.warn(`  - ${w}`))
    }

    if (!result.valid) {
        console.error("❌ ENVIRONMENT VALIDATION FAILED:")
        result.errors.forEach(e => console.error(`  - ${e}`))

        throw new Error(
            `Environment validation failed:\n${result.errors.join("\n")}`
        )
    }

    console.log("✅ Environment validation passed")
}