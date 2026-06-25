//! Domain type tidak import dari Prisma. DTO tidak boleh kenal ORM
// import type { UserRole } from "@prisma/client"

export type UserRole = "ADMIN" | "CUSTOMER"
// DTO - apa yang boleh keluar dari api
export interface UserDTO {
    id: number
    email: string
    role: UserRole
    isActive: boolean
    createdAt: Date
}

// Input untuk create user. Menerima plain password, BUKAN passwordHash
export interface CreateUserInput {
    email: string
    password: string
} 