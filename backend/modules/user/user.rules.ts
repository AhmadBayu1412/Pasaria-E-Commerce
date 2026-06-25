import { prisma } from "../../infra/db/prisma.js"
import { BusinessError } from "../../shared/errors/business.error.js"

export const UserRules = {
    async assertUniqueEmail(email: string): Promise<void> {
        const existing = await prisma.user.findUnique({
            where: { email }
        })

        if (existing) {
            throw new BusinessError("Email already registered", 409)
        }
    }
}