// ============================================================
// PRODUCT SERVICE - Function Signatures
// Contract: Business Logic + Transaction + Audit
// ============================================================

import type { Prisma } from "@prisma/client"
import { prisma } from "../../infra/db/prisma.js"
import { getCache, setCache } from "../../infra/cache/redis.service.js"
import { CacheKey } from "../../infra/cache/cache.helper.js"
import type { CreateProductInput, UpdateProductInput } from "./types/product.types.js"
import { ProductRules } from "./rules/product.rules.js"
import { TransactionManager } from "../../shared/transaction/transaction.js"
import type { AuthenticatedUser } from "../../shared/session/session.types.js"
import { assertCanUpdateProduct, assertCanDeleteProduct } from "../ownership/index.js"

// ============================================================
// READ OPERATIONS (Cache-first)
// ============================================================
// ----- Query -----
export async function getProducts(){
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
 * CREATE PRODUCT (dengan Transaction)
 *
 * Flow:
 * 1. Business rule (di luar tx - baca saja)
 * 2. Transaction:
 *    - Create product
 *    - Create audit log
 * 3. Commit berhasil → cache invalidation otomatis
 *
 * STEP 7:
 * - sellerId diambil dari req.user (bukan dari request body)
 * - Body request TIDAK boleh menentukan owner
 */
export async function createProduct(
    data: CreateProductInput,
    user: AuthenticatedUser
) {
    // 1. Business rule check
    await ProductRules.assertUniqueName(data.name)

    // 2. Execute dalam transaction
    const product = await TransactionManager.withTransaction(
        async (tx) => {
            // Create product - sellerId = user.id (dari session, BUKAN dari body)
            const newProduct = await tx.product.create({
                data: {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    stock: data.stock ?? 0,
                    sellerId: user.id
                }
            })

            // Create audit log (di dalam tx yang sama)
            await tx.audit.create({
                data: {
                    action: "CREATE_PRODUCT",
                    entityType: "Product",
                    entityId: newProduct.id,
                    data: JSON.stringify({
                        type: "CREATE",
                        product: newProduct
                    }),
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

// ============================================================
// UPDATE Operations (dengan Transaction)
// ============================================================

/**
 * UPDATE PRODUCT
 *
 * STEP 7:
 * - Ownership check di luar transaction (efisien)
 * - Fetch sebelum state untuk audit
 *
 * Query plan:
 * 1. assertCanUpdateProduct - validasi ownership (1 query)
 * 2. prisma.product.findUnique - ambil sebelum state untuk audit (1 query)
 * 3. tx.product.update - update (didalam transaction)
 * Total: 2 query di luar transaction
 */
export async function updateProduct(
    id: number,
    data: UpdateProductInput,
    user: AuthenticatedUser
) {
    // STEP 7: Ownership check - throw error jika tidak punya akses
    // Ini akan throw BusinessError 403 atau 404
    await assertCanUpdateProduct(id, user)

    // Business rule
    if (data.name) {
        await ProductRules.assertUniqueNameForUpdate(id, data.name)
    }

    // STEP 7: Ambil kondisi SEBELUM update untuk audit
    // Ini dilakukan di LUAR transaction karena hanya READ
    const beforeProduct = await prisma.product.findUnique({
        where: { id }
    })

    const updated = await TransactionManager.withTransaction(
        async (tx) => {
            // Update product
            const updatedProduct = await tx.product.update({
                where: { id },
                data: data as Prisma.ProductUpdateInput
            })

            // Audit log dengan BEFORE dan AFTER yang BENAR
            await tx.audit.create({
                data: {
                    action: "UPDATE_PRODUCT",
                    entityType: "Product",
                    entityId: id,
                    data: JSON.stringify({
                        type: "UPDATE",
                        before: beforeProduct,
                        after: updatedProduct
                    }),
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

// ============================================================
// DELETE Operations (dengan Transaction)
// ============================================================

/**
 * DELETE PRODUCT
 *
 * STEP 7:
 * - Ownership check di luar transaction (efisien)
 *
 * Query plan:
 * 1. assertCanDeleteProduct - validasi ownership + fetch untuk audit (1 query)
 * 2. tx.product.delete - delete (didalam transaction)
 * Total: 1 query di luar transaction (LEBIH EFISIEN)
 */
export async function deleteProduct(
    id: number,
    user: AuthenticatedUser
) {
    // STEP 7: Ownership check - throw error jika tidak punya akses
    // Untuk SELLER: fetch product untuk audit
    // Untuk ADMIN: bypass, tidak perlu fetch karena admin boleh delete apapun
    const existingProduct = await assertCanDeleteProduct(id, user)

    const deleted = await TransactionManager.withTransaction(
        async (tx) => {
            // Ambil product dalam tx jika belum di-fetch (untuk admin)
            // Jika SELLER, existingProduct sudah ada dari assertCanDeleteProduct
            const productForAudit = existingProduct
                ? existingProduct
                : await tx.product.findUnique({ where: { id } })
 
            // Delete product
            const result = await tx.product.delete({ where: { id } })

            // Create audit log
            if (productForAudit) {
                await tx.audit.create({
                    data: {
                        action: "DELETE_PRODUCT",
                        entityType: "Product",
                        entityId: id,
                        data: JSON.stringify({
                            type: "DELETE",
                            product: productForAudit
                        }),
                        createdAt: new Date()
                    }
                })
            }

            return result
        },
        [CacheKey.productsList, CacheKey.productDetail(id)]
    )

    return deleted
}