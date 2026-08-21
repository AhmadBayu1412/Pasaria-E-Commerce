import { prisma } from "../../infra/db/prisma"
import { UserRules } from "./user.rules"
import type { CreateUserInput, UserDTO } from "./types/user.types"
import { hashPassword } from "../../shared/security/password"
import { toUserDTO } from "./user.mapper"
import { BusinessError } from "../../shared/errors/business.error"


//! ============ CREATE USER ============
/**
 * 1. Validate password policy
 * 2. Check unique email (di service, BUKAN di rules)
 * 3. Hash password
 * 4. Save to DB
 * 5. Return DTO (bukan raw Prisma)
 */
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

//! ============ FIND USER ============
/**
 * Find user by email
 * Return raw user (with passwordHash) for authentication
 * HANYA boleh dipakai oleh auth service
*/ 
export async function findByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email }
    })
}

/**
 * Find user by Id
 * Return raw user for session validation
 * HANYA boleh dipakai oleh auth service/middleware
 */
export async function findById(id: number) {
    return prisma.user.findUnique({
        where: { id }
    })
}