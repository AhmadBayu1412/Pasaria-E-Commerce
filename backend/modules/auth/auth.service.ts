import { createUser } from "../user/user.service.js"
import { findByEmail } from "../user/user.service.js"
import type { RegisterInput } from "./auth.schema.js"
import type { LoginResponseDTO } from "./types/auth.types.js"
import type { UserDTO } from "../user/types/user.types.js"
import { BusinessError } from "../../shared/errors/business.error.js"
import { verifyPassword } from "../../shared/security/password.js"

/**
 * Auth service - menangani auth business logic
 * User lifecycle tetap di userService
 */
export const authService = {
    /**
     * Register user baru
    */
    async register(input: RegisterInput): Promise<UserDTO> {
        return createUser({
            email: input.email,
            password: input.password
        })
    },

    /**
     * Login User
     * 1. Find user via UserService (NOT direct Prisma)
     * 2. Check isActive
     * 3. verifyPassword()
     * 4. Return LoginResponseDTO (slim - hanya data yang diperlukan)
     */
    async login(input: {
        email: string;
        password: string
    }): Promise<{ user: LoginResponseDTO }> {
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

        // 5. Return slim LoginResponseDTO - hanya data yang diperlukan frontend
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role as LoginResponseDTO["role"]
            }
        }
    }
}