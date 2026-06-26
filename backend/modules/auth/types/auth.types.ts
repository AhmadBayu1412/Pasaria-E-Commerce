import type { UserRole } from "../../user/types/user.types.js"

// ============ DTOs ============
// Slim DTO untuk login response - hanya data yang diperlukan frontend
export interface LoginResponseDTO {
    id: number
    email: string
    role: UserRole
}