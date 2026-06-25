import type { User} from "@prisma/client"
import type { UserDTO, UserRole } from "./types/user.types.js"

// Konversi Prisma User -> UserDTO. passwordHash Tidak akan pernah keluar
export function toUserDTO(user: User): UserDTO {
    return {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt
    }
} 