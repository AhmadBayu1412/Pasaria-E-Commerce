// ============================================================
// CATEGORY SERVICE - Business Logic + Transaction + Audit
// ============================================================

import { prisma } from "../../infra/db/prisma.js"
import { getCache, setCache } from "../../infra/cache/redis.service.js"
import { CacheKey } from "../../infra/cache/cache.helper.js"
import type { CreateCategoryInput, UpdateCategoryInput } from "./types/category.types.js"
import { CategoryRules } from "./rules/category.rules.js"
import { TransactionManager } from "../../shared/transaction/transaction.js"
import type { AuthenticatedUser } from "../../shared/session/session.types.js"

// ============================================================
// READ OPERATIONS (Cache-first)
// ============================================================

export async function getCategories() {
    let cached = null
    try {
        cached = await getCache(CacheKey.categoriesList)
    } catch {
        console.log("[CACHE SKIPPED]")
    }

    if (cached) {
        console.log("[CACHE HIT] - categories")
        return cached
    }

    console.log("[CACHE MISS] - categories")
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" }
    })

    try {
        await setCache(CacheKey.categoriesList, categories, 300)
    } catch {
        console.log("[CACHE STORE FAILED]")
    }

    return categories
}

export async function getCategoryById(id: number) {
    const key = CacheKey.categoryDetail(id)
    let cached = null
    try {
        cached = await getCache(key)
    } catch {
        console.log("[CACHE SKIPPED]")
    }

    if (cached) {
        console.log(`[CACHE HIT] category ${id}`)
        return cached
    }

    console.log(`[CACHE MISS] category ${id}`)
    const category = await prisma.category.findUnique({ where: { id } })

    if (category) {
        try {
            await setCache(key, category, 300)
        } catch {
            console.log("[CACHE DETAIL STORE FAILED]")
        }
    }

    return category
}

// ============================================================
// WRITE OPERATIONS (With Transaction + Audit)
// ============================================================

export async function createCategory(
    data: CreateCategoryInput,
    _user: AuthenticatedUser
) {
    await CategoryRules.assertUniqueName(data.name)

    const category = await TransactionManager.withTransaction(
        async (tx) => {
            const newCategory = await tx.category.create({
                data: { name: data.name }
            })

            await tx.audit.create({
                data: {
                    action: "CREATE_CATEGORY",
                    entityType: "Category",
                    entityId: newCategory.id,
                    data: JSON.stringify({
                        type: "CREATE",
                        category: newCategory
                    }),
                    createdAt: new Date()
                }
            })

            return newCategory
        },
        [CacheKey.categoriesList]
    )

    return category
}

export async function updateCategory(
    id: number,
    data: UpdateCategoryInput,
    _user: AuthenticatedUser
) {
    await CategoryRules.assertCategoryExists(id)

    if (data.name) {
        await CategoryRules.assertUniqueNameForUpdate(id, data.name)
    }

    const beforeCategory = await prisma.category.findUnique({ where: { id } })

    const updated = await TransactionManager.withTransaction(
        async (tx) => {
            const updatedCategory = await tx.category.update({
                where: { id },
                data: data as { name?: string }
            })

            await tx.audit.create({
                data: {
                    action: "UPDATE_CATEGORY",
                    entityType: "Category",
                    entityId: id,
                    data: JSON.stringify({
                        type: "UPDATE",
                        before: beforeCategory,
                        after: updatedCategory
                    }),
                    createdAt: new Date()
                }
            })

            return updatedCategory
        },
        [CacheKey.categoriesList, CacheKey.categoryDetail(id)]
    )

    return updated
}

export async function deleteCategory(
    id: number,
    _user: AuthenticatedUser
) {
    await CategoryRules.assertCategoryExists(id)
    await CategoryRules.assertCategoryNotInUse(id)

    const existingCategory = await prisma.category.findUnique({ where: { id } })

    const deleted = await TransactionManager.withTransaction(
        async (tx) => {
            const result = await tx.category.delete({ where: { id } })

            if (existingCategory) {
                await tx.audit.create({
                    data: {
                        action: "DELETE_CATEGORY",
                        entityType: "Category",
                        entityId: id,
                        data: JSON.stringify({
                            type: "DELETE",
                            category: existingCategory
                        }),
                        createdAt: new Date()
                    }
                })
            }

            return result
        },
        [CacheKey.categoriesList, CacheKey.categoryDetail(id)]
    )

    return deleted
}