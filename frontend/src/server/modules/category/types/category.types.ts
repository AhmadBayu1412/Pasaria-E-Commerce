
// ============================================================
// CATEGORY DOMAIN TYPES (Anemic Model)
// ============================================================

import { Prisma } from "@prisma/client"

export interface Category {
    readonly id: number
    readonly name: string
    readonly createdAt: Date
    readonly updatedAt: Date
}

export interface CategoryWithProducts extends Category {
    readonly products: Prisma.ProductGetPayload<{}>[]
}

export interface CreateCategoryInput {
    readonly name: string
}

export interface UpdateCategoryInput {
    readonly name?: string
}