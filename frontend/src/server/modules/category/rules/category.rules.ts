// ============================================================
// CATEGORY RULES (Business Invariants)
// ============================================================

import { prisma } from "../../../infra/db/prisma"
import { BusinessError } from "../../../shared/errors/business.error"

export const CategoryRules = {
    async assertUniqueName(name: string): Promise<void> {
        const existing = await prisma.category.findFirst({
            where: { name: { equals: name, mode: "insensitive" } }
        })

        if (existing) {
            throw new BusinessError("Category already exists", 409)
        }
    },

    async assertUniqueNameForUpdate(id: number, name: string): Promise<void> {
        const existing = await prisma.category.findFirst({
            where: { name: { equals: name, mode: "insensitive" } }
        })

        if (existing && existing.id !== id) {
            throw new BusinessError("Category name already taken by another category", 409)
        }
    },

    async assertCategoryExists(id: number): Promise<void> {
        const category = await prisma.category.findUnique({ where: { id } })
        if (!category) {
            throw new BusinessError("Category not found", 404)
        }
    },

    async assertCategoryNotInUse(id: number): Promise<void> {
        const productCount = await prisma.product.count({
            where: { categoryId: id }
        })

        if (productCount > 0) {
            throw new BusinessError(
                `Cannot delete category. ${productCount} product(s) are still using this category. Please reassign or remove products first.`,
                409
            )
        }
    }
}