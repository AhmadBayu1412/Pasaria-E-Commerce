import type { User } from "@prisma/client"
import type { UserDTO } from "./types/user.types.js"

export function toUserDTO(user: User): UserDTO {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
    }
}