/**
 * Centralized authentication types
 * Semua module import dari sini
 */

// Import UserRole dari user module (single source of truth)
import type { UserRole } from "../../../modules/user/types/user.types.js"

// Re-export untuk方便 module lain import dari sini
export type { UserRole } from "../../../modules/user/types/user.types.js"
export type { UserDTO } from "../../../modules/user/types/user.types.js"
export type { CreateUserInput } from "../../../modules/user/types/user.types.js"

// ============= SESSION DATA - data yang disimpan di Redis ============
export interface SessionData {
    userId: number
    role: UserRole
}

/**
 * AuthenticatedUser - context yang di attach ke request
 * Dipakai di controller untuk akses user info
 */
export interface AuthenticatedUser {
    id: number
    role: UserRole
    sessionId: string
}

// =============== LOGIN RESPONSE DTO =========================
export interface LoginResponseDTO {
    id: number
    email: string
    role: UserRole
}