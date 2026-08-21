import { createUser, findByEmail } from "../user/user.service"
import { sessionService } from "./session.service"
import type { RegisterInput } from "./auth.schema"
import type { LoginResponseDTO, SessionData } from "../../shared/auth/types/auth.types"
import { AUTH_ERRORS } from "../../shared/auth/errors/auth.errors"
import { verifyPassword } from "../../shared/security/password"
import {
    checkBruteForce,
    recordFailedAttempt,
    clearFailedAttempts
} from "../../shared/security/brute-force"

/**
 * Auth Service
 *
 * Bertanggung jawab:
 * - Register (user creation)
 * - Login (credential verification + session creation)
 *
 * Session lifecycle di-delegate ke sessionService
 * Brute force protection di-delegate ke brute-force module
 */
export const authService = {
    /**
     * Login User
     * 1. Check brute force protection
     * 2. Find user via UserService
     * 3. verifyPassword()
     * 4. Clear failed attempts on success
     * 5. Create session
     * 6. Return user + sessionId
     */
    async login(input: {
        email: string;
        password: string;
        ip?: string
    }): Promise<{ user: LoginResponseDTO; sessionId: string }> {
        const identifier = input.email.toLowerCase().trim()
        const clientIp = input.ip || "unknown"

        // 1. Check brute force SEBELUM credential validation
        const bruteCheck = await checkBruteForce(clientIp, identifier)

        if (bruteCheck.blocked) {
            throw AUTH_ERRORS.tooManyAttempts
        }

        // 2. Find user via UserService (email sudah dinormalisasi)
        const user = await findByEmail(identifier)

        // 3. Unified error message (security best practice)
        // Jangan bilang "email tidak ditemukan" atau "password salah"
        // Gunakan pesan yang sama untuk keduanya
        if (!user) {
            await recordFailedAttempt(clientIp, identifier)
            throw AUTH_ERRORS.invalidCredentials
        }

        // 4. Check account active
        if (!user.isActive) {
            throw AUTH_ERRORS.userInactive
        }

        // 5. Verify password
        const isValid = await verifyPassword(input.password, user.passwordHash)

        if (!isValid) {
            await recordFailedAttempt(clientIp, identifier)
            throw AUTH_ERRORS.invalidCredentials
        }

        // 6. Success - clear all failed attempts
        await clearFailedAttempts(clientIp, identifier)

        // 7. Create session
        const sessionData: SessionData = {
            userId: user.id,
            role: user.role
        }

        const sessionId = await sessionService.create(sessionData)

        // 8. Return user + sessionId
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role as LoginResponseDTO["role"]
            },
            sessionId
        }
    },

    /**
     * Register user baru
     */
    async register(input: RegisterInput): Promise<LoginResponseDTO> {
        const user = await createUser({
            email: input.email,
            password: input.password
        })

        return {
            id: user.id,
            email: user.email,
            role: user.role
        }
    },

    /**
     * Logout
     * Hapus session dari storage
     * Cookie deletion handled by controller
     */
    async logout(sessionId: string): Promise<void> {
        await sessionService.delete(sessionId)
    }
}