//! Domain type tidak import dari Prisma. DTO tidak boleh kenal ORM
import type { User as PrismaUser } from "@prisma/client"

export type UserRole = "ADMIN" | "SELLER" | "CUSTOMER"
// DTO - apa yang boleh keluar dari api
export interface UserDTO {
    id: number
    email: string
    role: UserRole
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

// Input untuk create user. Menerima plain password, BUKAN passwordHash
export interface CreateUserInput {
    email: string
    password: string
}

// STEP 7: Untuk relasi dengan products
export interface UserWithProducts extends UserDTO {
    products: Array<{
        id: number
        name: string
        price: number
        sellerId: number
    }>
}