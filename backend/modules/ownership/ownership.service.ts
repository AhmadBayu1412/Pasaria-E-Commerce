import { prisma } from "../../infra/db/prisma.js"
import { BusinessError } from "../../shared/errors/business.error.js"
import type { AuthenticatedUser } from "../../shared/auth/types/auth.types.js"

/**
 * STEP 7: Ownership Service
 *
 * Prinsip:
 * - ADMIN bypass semua ownership check
 * - SELLER hanya bisa modify resource miliknya sendiri
 *
 * Note: CUSTOMER tidak perlu dicek karena route sudah filter lewat authorize("ADMIN", "SELLER")
 */

/**
 * Validasi apakah user boleh mengupdate produk
 *
 * Aturan:
 * - ADMIN: boleh update semua produk
 * - SELLER: hanya boleh update produk miliknya sendiri
 *
 * @param productId - ID produk yang akan diupdate
 * @param user - User yang sedang request (dari req.user)
 * @returns Product yang ditemukan (untuk optimasi, menghindari double fetch)
 * @throws BusinessError 403 jika tidak punya akses
 * @throws BusinessError 404 jika produk tidak ditemukan
 */
export async function assertCanUpdateProduct(
    productId: number,
    user: AuthenticatedUser
): Promise<{ id: number; sellerId: number } | null> {
    // ADMIN bypass semua ownership check
    if (user.role === "ADMIN") {
        // Admin bypass, return null karena tidak perlu cek ownership
        return null
    }

    // Ambil produk dari database
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, sellerId: true }
    })

    if (!product) {
        throw new BusinessError("Produk tidak ditemukan", 404)
    }

    // SELLER harus memiliki produk ini
    if (product.sellerId !== user.id) {
        throw new BusinessError(
            "Anda tidak memiliki akses untuk mengubah produk ini",
            403
        )
    }

    return product
}

/**
 * Validasi apakah user boleh menghapus produk
 *
 * Aturan:
 * - ADMIN: boleh delete semua produk
 * - SELLER: hanya boleh delete produk miliknya sendiri
 *
 * @param productId - ID produk yang akan didelete
 * @param user - User yang sedang request
 * @returns Product yang ditemukan (untuk optimasi, menghindari double fetch)
 * @throws BusinessError 403 jika tidak punya akses
 * @throws BusinessError 404 jika produk tidak ditemukan
 */
export async function assertCanDeleteProduct(
    productId: number,
    user: AuthenticatedUser
): Promise<{ id: number; sellerId: number } | null> {
    // ADMIN bypass
    if (user.role === "ADMIN") {
        // Admin bypass, return null karena tidak perlu cek ownership
        return null
    }

    // Ambil produk
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, sellerId: true }
    })

    if (!product) {
        throw new BusinessError("Produk tidak ditemukan", 404)
    }

    // SELLER harus miliki produk ini
    if (product.sellerId !== user.id) {
        throw new BusinessError(
            "Anda tidak memiliki akses untuk menghapus produk ini",
            403
        )
    }

    return product
}