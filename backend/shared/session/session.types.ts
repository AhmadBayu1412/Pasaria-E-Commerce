import type { UserRole } from "../../modules/user/types/user.types.js";

/**
 * SessionData - data yang disimpan di redis
 */
export interface SessionData {
    userId: number
    role: UserRole
} 
 
/**
 * AuthenticatedUser - Context yang di attach ke request
 * Dipakai di controller untuk akses user info
 */
export interface AuthenticatedUser {
    id: number
    role: UserRole
    sessionId: string // Untuk logout, audit, rotate - tanpa baca cookie lagi
}