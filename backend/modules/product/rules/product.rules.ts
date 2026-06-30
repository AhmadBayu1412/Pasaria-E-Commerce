// ============================================================
// PRODUCT RULES (Business Invariants)
// Focus: Enforce business constraints ONLY
// ============================================================

import { prisma } from "../../../infra/db/prisma"
import { BusinessError } from "../../../shared/errors/business.error"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"

// ----- Generic Ownership Assertion -----
/**
 * Validasi apakah user boleh mengakses produk
 * 
 * Aturan:
 * - ADMIN: bypass semua ownership check
 * - SELLER: hanya boleh akses produk miliknya sendiri
 * - CUSTOMER: tidak boleh akses (seharusnya tidak sampai di sini)
 */
export async function assertOwnership(
    productId: number,
    user: AuthenticatedUser
    ): Promise<{ id: number; sellerId: number } | null> {
    // ADMIN bypass semua ownership check
    if (user.role === "ADMIN") {
        return null
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, sellerId: true }
    })

    if (!product) {
        throw new BusinessError("Produk tidak ditemukan", 404)
    }

    // SELLER harus memiliki produk ini
    if (product.sellerId !== user.id) {
        throw new BusinessError("Anda tidak memiliki akses ke produk ini", 403)
    }

    return product
    }

    // ----- Validasi: Nama produk harus unik -----
    export async function assertUniqueName(name: string): Promise<void> {
    const existing = await prisma.product.findFirst({ where: { name } })

    if (existing) {
        throw new BusinessError("Product already exists", 409)
    }
    }

    // ----- Validasi: Nama unik saat update (exclude self) -----
    export async function assertUniqueNameForUpdate(
    id: number,
    name: string
    ): Promise<void> {
    const existing = await prisma.product.findFirst({ where: { name } })

    if (existing && existing.id !== id) {
        throw new BusinessError("Product name already taken by another product", 409)
    }
    }

    // ----- Validasi: CategoryId harus ada di database -----
    export async function assertCategoryExists(categoryId: number): Promise<void> {
    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    })

    if (!category) {
        throw new BusinessError("Category not found", 404)
    }
    }

    // ----- Validasi: Seller produk tertentu (untuk audit) -----
    export async function getSellerId(productId: number): Promise<number | null> {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { sellerId: true }
    })

    return product?.sellerId ?? null
}