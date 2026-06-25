// @file: modules/product/product.service.ts

import type { Prisma } from "@prisma/client"
import { prisma } from "../../infra/db/prisma"
import {getCache, setCache} from "../../infra/cache/redis.service"  // ← Hapus deleteCache
import { CacheKey } from "../../infra/cache/cache.helper"
import { CreateProductInput, UpdateProductInput } from "./types/product.types.js"
import { ProductRules } from "./rules/product.rules.js"
import { TransactionManager } from "../../shared/transaction/transaction.js"

// READ OPERATIONS (Cache-first, tidak perlu transaction)
export async function getProducts() {
    let cached = null
    try {
        cached = await getCache(CacheKey.productsList)
    } catch {
        console.log("[CACHE SKIPPED]")
    }

    if (cached) {
        console.log("[CACHE HIT] - products")
        return cached
    }

    console.log("[CACHE MISS] - products")
    const products = await prisma.product.findMany()
    const normalized = products.map(p => ({
        ...p,
        price: p.price.toNumber()
    }))

    try {
        await setCache(CacheKey.productsList, normalized, 300)
    } catch {
        console.log("[CACHE STORE FAILED]")
    }

    return normalized
}

export async function getProductById(id: number) {
    const key = CacheKey.productDetail(id)
    let cached = null
    try {
        cached = await getCache(key)
    } catch {
        console.log("[CACHE SKIPPED]")
    }

    if (cached) {
        console.log(`[CACHE HIT] product ${id}`)
        return cached
    }

    console.log(`[CACHE MISS] product ${id}`)
    const product = await prisma.product.findUnique({ where: { id } })

    if (product) {
        const normalized = { ...product, price: product.price.toNumber() }
        try {
            await setCache(key, normalized, 300)
        } catch {
            console.log("[CACHE DETAIL STORE FAILED]")
        }
        return normalized
    }
    return product
}

// ============================================================
// WRITE OPERATIONS (Dengan Transaction + Audit)
// ============================================================

/**
 * CREATE dengan Transaction
 * 
 * Flow:
 * 1. Business rule (di luar tx - baca saja)
 * 2. Transaction:
 *    - Create product
 *    - Create audit log
 * 3. Commit berhasil → cache invalidation otomatis
 */
export async function createProduct(data: CreateProductInput) {
    // 1. Business rule
    await ProductRules.assertUniqueName(data.name)

    // 2. Execute dalam transaction
    const product = await TransactionManager.withTransaction(
        async (tx) => {
            // 2a. Create product
            const newProduct = await tx.product.create({
                data: {
                    ...data,
                    stock: data.stock ?? 0
                }
            })

            // 2b. Create audit log (di dalam tx yang sama)
            await tx.audit.create({
                data: {
                    action: "CREATE_PRODUCT",
                    entityType: "Product",
                    entityId: newProduct.id,
                    data: JSON.stringify(newProduct),
                    createdAt: new Date()
                }
            })

            return newProduct
        },
        // 3. Cache invalidation SETELAH commit berhasil
        [CacheKey.productsList]
    )

    // 4. Convert & return
    return {
        ...product,
        price: product.price.toNumber()
    }
}

/**
 * UPDATE dengan Transaction
 */
export async function updateProduct(id: number, data: UpdateProductInput) {
    if (data.name) {
        await ProductRules.assertUniqueNameForUpdate(id, data.name)
    }

    const updated = await TransactionManager.withTransaction(
        async (tx) => {
            // Update product
            const updatedProduct = await tx.product.update({
                where: { id },
                data: data as Prisma.ProductUpdateInput
            })

            // Create audit log
            await tx.audit.create({
                data: {
                    action: "UPDATE_PRODUCT",
                    entityType: "Product",
                    entityId: id,
                    data: JSON.stringify({ before: data, after: updatedProduct }),
                    createdAt: new Date()
                }
            })

            return updatedProduct
        },
        // Cache invalidation SETELAH commit
        [CacheKey.productsList, CacheKey.productDetail(id)]
    )

    return {
        ...updated,
        price: updated.price.toNumber()
    }
}

/**
 * DELETE dengan Transaction
 */
export async function deleteProduct(id: number) {
    const deleted = await TransactionManager.withTransaction(
        async (tx) => {
            // Get product before delete for audit
            const product = await tx.product.findUnique({ where: { id } })
            
            // Delete product
            const result = await tx.product.delete({ where: { id } })

            // Create audit log
            if (product) {
                await tx.audit.create({
                    data: {
                        action: "DELETE_PRODUCT",
                        entityType: "Product",
                        entityId: id,
                        data: JSON.stringify(product),
                        createdAt: new Date()
                    }
                })
            }

            return result
        },
        [CacheKey.productsList, CacheKey.productDetail(id)]
    )

    // ← HAPUS: deleteCache() di luar
    return deleted
}
