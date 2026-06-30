// ============================================================
// PRODUCT SERVICE - Function Signatures
// Contract: Business Logic + Transaction + Audit
// ============================================================

import type { Prisma } from "@prisma/client"
import { prisma } from "../../../infra/db/prisma.js"
import { getCache, setCache } from "../../../infra/cache/redis.service.js"
import { CacheKey } from "../../../infra/cache/cache.helper.js"
import type { CreateProductInput, UpdateProductInput } from "../validation/product.validation.js"
import type { PaginationParamsDTO, PaginatedProductResponseDTO, ProductResponseDTO } from "../types/product.dto.js"
import { assertOwnership, assertUniqueName, assertUniqueNameForUpdate, assertCategoryExists } from "../rules/product.rules.js"
import { TransactionManager } from "../../../shared/transaction/transaction.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"

// ----- Normalize Product for Response -----
function normalizeProduct(product: any): ProductResponseDTO {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price.toNumber ? product.price.toNumber() : product.price,
        stock: product.stock,
        sellerId: product.sellerId,
        categoryId: product.categoryId,
        createdAt: product.createdAt instanceof Date 
        ? product.createdAt.toISOString() 
        : new Date(product.createdAt).toISOString(),
        updatedAt: product.updatedAt instanceof Date 
        ? product.updatedAt.toISOString() 
        : new Date(product.updatedAt).toISOString()
    }
    }

    // ============================================================
    // READ OPERATIONS (Cache-first)
    // ============================================================

    /**
     * GET PRODUCTS - Pagination Version
     * 
     * Visibility:
     * - ADMIN/SELLER: semua produk mereka
     * - CUSTOMER/PUBLIC: hanya produk yang visible (future: status=ACTIVE)
     */
    export async function getProducts(
    params: PaginationParamsDTO = {},
    user?: AuthenticatedUser
    ): Promise<PaginatedProductResponseDTO> {
    const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc"
    } = params

    const skip = (page - 1) * limit
    const orderBy = { [sortBy]: sortOrder }

    // Build where clause berdasarkan role
    const where: Prisma.ProductWhereInput = {}

    // SELLER hanya melihat produk miliknya
    if (user?.role === "SELLER") {
        where.sellerId = user.id
    }

    // CUSTOMER hanya melihat produk yang visible
    // TODO: where.status = ProductStatus.ACTIVE (after status field exists)

    const [products, total] = await Promise.all([
        prisma.product.findMany({
        skip,
        take: limit,
        orderBy,
        where,
        include: {
            category: {
            select: { id: true, name: true }
            }
        }
        }),
        prisma.product.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
        success: true,
        data: products.map(p => normalizeProduct(p)),
        pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page * limit < total,
        hasPrev: page > 1
        }
    }
    }

    /**
     * GET PRODUCT BY ID - Single product fetch
     */
    export async function getProductById(id: number): Promise<ProductResponseDTO | null> {
    const key = CacheKey.productDetail(id)
    
    let cached = null
    try {
        cached = await getCache(key)
    } catch {
        console.log("[CACHE SKIPPED]")
    }

    if (cached) {
        console.log(`[CACHE HIT] product ${id}`)
        return cached as ProductResponseDTO
    }

    console.log(`[CACHE MISS] product ${id}`)
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
        category: {
            select: { id: true, name: true }
        }
        }
    })

    if (product) {
        const normalized = normalizeProduct(product)
        try {
        await setCache(key, normalized, 300)
        } catch {
        console.log("[CACHE DETAIL STORE FAILED]")
        }
        return normalized
    }

    return null
    }

    // ============================================================
    // WRITE OPERATIONS (With Transaction + Audit)
    // ============================================================

    /**
     * CREATE PRODUCT
     */
    export async function createProduct(
    data: CreateProductInput,
    user: AuthenticatedUser
    ): Promise<ProductResponseDTO> {
    // 1. Business rule check
    await assertUniqueName(data.name)

    if (data.categoryId) {
        await assertCategoryExists(data.categoryId)
    }

    // 2. Execute in transaction
    const product = await TransactionManager.withTransaction(
        async (tx) => {
        const newProduct = await tx.product.create({
            data: {
            name: data.name,
            description: data.description,
            price: data.price,
            stock: data.stock ?? 0,
            sellerId: user.id,
            categoryId: data.categoryId
            }
        })

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
        [CacheKey.productsList]
    )

    return normalizeProduct(product)
    }

    /**
     * UPDATE PRODUCT
     */
    export async function updateProduct(
    id: number,
    data: UpdateProductInput,
    user: AuthenticatedUser
    ): Promise<ProductResponseDTO> {
    // 1. Ownership check
    await assertOwnership(id, user)

    // 2. Business rule
    if (data.name) {
        await assertUniqueNameForUpdate(id, data.name)
    }

    if (data.categoryId) {
        await assertCategoryExists(data.categoryId)
    }

    // 3. Fetch before state for audit
    const beforeProduct = await prisma.product.findUnique({ where: { id } })

    // 4. Execute in transaction
    const updated = await TransactionManager.withTransaction(
        async (tx) => {
        const updatedProduct = await tx.product.update({
            where: { id },
            data: data as Prisma.ProductUpdateInput
        })

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
        [CacheKey.productsList, CacheKey.productDetail(id)]
    )

    return normalizeProduct(updated)
    }

    /**
     * DELETE PRODUCT
     */
    export async function deleteProduct(
    id: number,
    user: AuthenticatedUser
    ): Promise<void> {
    // 1. Ownership check (returns product for audit if seller)
    const existingProduct = await assertOwnership(id, user)

    await TransactionManager.withTransaction(
        async (tx) => {
        const productForAudit = existingProduct
            ? await tx.product.findUnique({ where: { id } })
            : existingProduct

        const result = await tx.product.delete({ where: { id } })

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
}