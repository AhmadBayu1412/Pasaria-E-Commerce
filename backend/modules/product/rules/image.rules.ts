// modules/product/rules/image.rules.ts

// ============================================================
// IMAGE BUSINESS RULES (Phase 3 Step 5)
// Enforce domain invariants - no side effects
// ============================================================

import { prisma } from "../../../infra/db/prisma.js"
import { BusinessError } from "../../../shared/errors/business.error.js"
import { assertOwnership } from "./product.rules.js"
import { IMAGE_CONFIG, isAllowedMimeType } from "../validation/image.validation.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"

// Re-export for convenience
export { assertOwnership } from "./product.rules.js"

// ============================================================
// OWNERSHIP & ACCESS RULES
// ============================================================

/**
 * Validasi user boleh mengelola gambar product ini
 * - ADMIN: bypass semua ownership
 * - SELLER: harus own product
 * - CUSTOMER: tidak boleh (seharusnya tidak sampai di sini)
 * 
 * @returns Image record jika valid
 * @throws BusinessError jika tidak punya akses
 */
export async function assertImageOwnership(
  productId: number,
  imageId: number,
  user: AuthenticatedUser
): Promise<{ id: number; productId: number; isPrimary: boolean; path: string }> {
  // Reuse existing product ownership check
  await assertOwnership(productId, user)

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true, isPrimary: true, path: true }
  })

  if (!image) {
    throw new BusinessError("Image tidak ditemukan", 404, "IMAGE_NOT_FOUND")
  }

  if (image.productId !== productId) {
    throw new BusinessError("Image tidak принадлежит продукту ini", 404, "IMAGE_NOT_FOUND")
  }

  return image
}

/**
 * Validasi image exists dan milik product ini
 */
export async function assertImageExists(
  productId: number,
  imageId: number
): Promise<{ id: number; productId: number; isPrimary: boolean; path: string }> {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true, isPrimary: true, path: true }
  })

  if (!image) {
    throw new BusinessError("Image tidak ditemukan", 404, "IMAGE_NOT_FOUND")
  }

  if (image.productId !== productId) {
    throw new BusinessError("Image tidak принадлежит продукту ini", 404, "IMAGE_NOT_FOUND")
  }

  return image
}

// ============================================================
// BUSINESS INVARIANTS
// ============================================================

/**
 * Validasi jumlah gambar tidak melebihi maximum
 */
export async function assertCanAddImage(productId: number): Promise<void> {
  const currentCount = await prisma.productImage.count({
    where: { productId }
  })

  if (currentCount >= IMAGE_CONFIG.MAX_IMAGES_PER_PRODUCT) {
    throw new BusinessError(
      `Maksimal ${IMAGE_CONFIG.MAX_IMAGES_PER_PRODUCT} gambar per produk`,
      400,
      "MAX_IMAGES_EXCEEDED"
    )
  }
}

/**
 * Validasi tipe file diperbolehkan
 */
export function assertValidMimeType(mimeType: string): void {
  if (!isAllowedMimeType(mimeType)) {
    throw new BusinessError(
      `Tipe file tidak diperbolehkan. Hanya: ${IMAGE_CONFIG.ALLOWED_MIME_TYPES.join(", ")}`,
      400,
      "INVALID_FILE_TYPE"
    )
  }
}

/**
 * Validasi ukuran file tidak melebihi maximum
 */
export function assertValidFileSize(sizeBytes: number): void {
  if (sizeBytes > IMAGE_CONFIG.MAX_FILE_SIZE) {
    throw new BusinessError(
      `Ukuran file maksimal ${IMAGE_CONFIG.MAX_FILE_SIZE_DISPLAY}`,
      400,
      "FILE_TOO_LARGE"
    )
  }
}

/**
 * Validasi hanya 1 primary image per product
 * Jika image baru adalah primary, unset primary yang lama
 */
export async function assertSinglePrimary(
  productId: number,
  newIsPrimary: boolean
): Promise<void> {
  if (!newIsPrimary) return

  // Unset existing primary
  await prisma.productImage.updateMany({
    where: {
      productId,
      isPrimary: true
    },
    data: {
      isPrimary: false
    }
  })
}

/**
 * Validasi semua imageIds milik product ini (untuk reorder)
 */
export async function assertImagesBelongToProduct(
  productId: number,
  imageIds: number[]
): Promise<void> {
  const images = await prisma.productImage.findMany({
    where: {
      id: { in: imageIds },
      productId
    },
    select: { id: true }
  })

  const foundIds = new Set(images.map(img => img.id))
  const missingIds = imageIds.filter(id => !foundIds.has(id))

  if (missingIds.length > 0) {
    throw new BusinessError(
      `Image ID(s) tidak ditemukan: ${missingIds.join(", ")}`,
      404,
      "IMAGE_NOT_FOUND"
    )
  }
}