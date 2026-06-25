// UserRole enum (mirror dari Prisma)
import type { UserRole } from "@prisma/client"

// DTO - apa yang boleh keluar dari api
export interface UserDTO {
    id: number
    email: string
    role: UserRole
    isActive: boolean
    createdAt: Date
}

// Input untuk create (passwordHash dari auth, bukan plain password)
export interface CreateUserInput {
    email: string
    passwordHash: string
}