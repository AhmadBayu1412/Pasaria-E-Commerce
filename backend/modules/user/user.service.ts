import { prisma } from "../../infra/db/prisma.js"
import { UserRules } from "./user.rules.js"
import type { CreateUserInput } from "./types/user.types.js"

// Cari user berdasarkan email
export async function findUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email }
    })
}

// Cari user berdasarkan id
export async function findUserById(id: number) {
    return prisma.user.findUnique({
        where: { id }
    })
}

// Create user
export async function createUser(data: CreateUserInput) {
    // 1. Cek email unik
    await UserRules.assertUniqueEmail(data.email)

    // 2. Create
    return prisma.user.create({
        data: {
            email: data.email,
            passwordHash: data.passwordHash
        }
    })
}