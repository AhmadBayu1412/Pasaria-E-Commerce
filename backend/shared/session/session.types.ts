import type { UserRole } from "../../modules/user/types/user.types.js";

/**
 * SessionData - data yang disimpan di redis
 * SEMAKIN SEDIKIT SEMAKIN BAIK
 * 
 * createdAt tidak diperlukan - Redis sudah punya Ex (TTL)
 * Kalau butuh login history, buat tabel terpisah
 */
export interface SessionData {
    userId: number
    role: UserRole
} 

/**
 * AuthenticatedUser - COntext yang di attach ke request
 * Dipakai di controller untuk akses user info
 */
export interface AuthenticatedUser {
    id: number
    role: UserRole
    sessionId: string // Untuk logout, audit, rotate - tanpa baca cookie lagi
}