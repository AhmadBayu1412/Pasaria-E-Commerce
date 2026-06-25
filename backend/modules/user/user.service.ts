import { prisma } from "../../infra/db/prisma.js"
import { UserRules } from "./user.rules.js"
import type { CreateUserInput, UserDTO } from "./types/user.types.js"
import { hashPassword } from "../../shared/security/password.js"
import { toUserDTO } from "./user.mapper.js"
import { BusinessError } from "../../shared/errors/business.error.js"

/**
 * Create user
 *
 * Flow:
 * 1. Validate password policy
 * 2. Check unique email (di service, BUKAN di rules)
 * 3. Hash password
 * 4. Save to DB
 * 5. Return DTO (bukan raw Prisma)
 */

// Create user
export async function createUser(data: CreateUserInput): Promise<UserDTO> {
    // 1. Validate password policy (pure function)
    UserRules.validatePassword(data.password)

    // 2. Check unique email (di service)
    const existing = await prisma.user.findUnique({
        where: { email: data.email }
    })

    if (existing) {
        throw new BusinessError("Email sudah digunakan", 409)
    }

    // 3. Hash password
    const passwordHash = await hashPassword(data.password)

    // 4. Save to DB
    const created = await prisma.user.create({
        data: {
            email: data.email,
            passwordHash: passwordHash
        }
    })

    // 5. Return DTO (bukan raw Prisma)
    return toUserDTO(created)
}

// Cari user berdasarkan email
// export async function findUserByEmail(email: string) {
//     return prisma.user.findUnique({
//         where: { email }
//     })
// } 

// Cari user berdasarkan id
// export async function findUserById(id: number) {
//     return prisma.user.findUnique({
//         where: { id }
//     })
// }
