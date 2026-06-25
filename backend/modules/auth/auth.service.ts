import { createUser } from "../user/user.service.js";
import type { RegisterInput } from "./auth.schema.js";
import type { UserDTO } from "../user/types/user.types.js";

/**
 * Auth service - menangani auth business logic
 * User lifecycle tetap di userService
 */
export const authService = {
    /** 
     * Register user baru
     * - Normalize email
     * - Delegate ke userService
    */
async register(input: RegisterInput): Promise<UserDTO> {
    // Normalize email: lowercase + trim
    const normalizedEmail = input.email.toLowerCase().trim()

    return createUser({
        email: normalizedEmail,
        password: input.password
    })
}
}