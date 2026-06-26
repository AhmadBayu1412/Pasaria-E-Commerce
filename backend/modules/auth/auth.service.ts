import { createUser } from "../user/user.service.js"
import { findByEmail } from "../user/user.service.js"
import { sessionService } from "./session.service.js"
import type { RegisterInput } from "./auth.schema.js"
import type { LoginResponseDTO } from "./types/auth.types.js"
import type { SessionData } from "../../shared/session/session.types.js"
import { BusinessError } from "../../shared/errors/business.error.js"
import { verifyPassword } from "../../shared/security/password.js"

/**
 * Auth service 
 * - menangani auth business logic
 * - User lifecycle tetap di userService
 * Bertanggung jawab:
 * - Register (user creation)
 * - Login (credential verification + session creation)
 * 
 * Session lifecycle di-delegate ke sessionService
 */
export const authService = {
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
     * Login User - SINGLE METHOD, tidak ada loginWithSession
     * 1. Find user via UserService (NOT direct Prisma)
     * 2. verifyPassword()
     * 3. Create session
     * 4. Return user + sessionId
     * 
     * Controller handle;
     * - Set cookie
     * - Return response
     */
    async login(input: {
        email: string;
        password: string
    }): Promise<{ user: LoginResponseDTO; sessionId: string }> {
        // 1. find user via UserService (email sudah di normalized)
        const user = await findByEmail(input.email)
 
        // 2. user not found -> unified error (security)
        if (!user) {
            throw new BusinessError("Email atau password salah", 401)
        }

        // 3. check account active
        if (!user.isActive) {
            throw new BusinessError("Akun non-aktif. Hubungi support.", 403)
        }

        // 4. verify password
        const isValid = await verifyPassword(input.password, user.passwordHash)

        if (!isValid) {
            throw new BusinessError("Email atau password salah", 401)
        }

        // 5. Create session
        const sessionData: SessionData = {
            userId: user.id,
            role: user.role
        }

        const sessionId = await sessionService.create(sessionData)

        // 6. Return user + sessionId
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
     * Logout
     * Hapus session dari storage
     * Cookie deletion handled by controller 
     */
    async logout(sessionId: string): Promise<void> {
        await sessionService.delete(sessionId)
    }
}