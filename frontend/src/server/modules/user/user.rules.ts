// import { prisma } from "../../infra/db/prisma"
import { BusinessError } from "../../shared/errors/business.error"

// User validation rules: Pure function - tidak akses database.
export const UserRules = {
    // async assertUniqueEmail(email: string): Promise<void> {
    //     const existing = await prisma.user.findUnique({
    //         where: { email }
    //     })

    //     if (existing) {
    //         throw new BusinessError("Email already registered", 409)
    //     }
    // }
    
    validatePassword(password: string): void {
        if (password.length < 8) {
            throw new BusinessError("Password minimal 8 karakter", 400)
        }
    }
} 