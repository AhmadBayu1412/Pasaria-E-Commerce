// ============================================================
// IMAGE SERVICE (Phase 3 Step 5)
// All image operations with transaction + audit
// ============================================================

import { prisma } from "../../../infra/db/prisma.js"
import { TransactionManager } from "../../../shared/transaction/transaction.js"
import { CacheKey } from "../../../infra/cache/cache.helper.js"
import { deleteCache } from "../../../infra/cache/redis.service.js"
import {
  assertImageOwnership,
  assertImageExists,
  assertCanAddImage,
  assertValidMimeType,
  assertValidFileSize,
  assertSinglePrimary,
  assertImagesBelongToProduct,
  assertOwnership
} from "../rules/image.rules.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"
import type { MulterFile } from "../../../shared/types/multer.js"
import type {
  ProductImageResponseDTO,
  ProductImageListResponseDTO,
  ImageUploadResponseDTO,
  ImageDeleteResponseDTO,
  ImageReorderResponseDTO
} from "../types/image.dto.js"
import { writeFile, unlink, mkdir } from "fs/promises"
import { join, dirname, extname } from "path"
import { randomBytes } from "crypto"

// ============================================================
// NORMALIZER
// ============================================================

function normalizeImage(image: any): ProductImageResponseDTO {
  return {
    id: image.id,
    productId: image.productId,
    path: image.path,
    filename: image.filename,
    mimeType: image.mimeType,
    size: image.size,
    position: image.position,
    isPrimary: image.isPrimary,
    createdAt: image.createdAt instanceof Date
      ? image.createdAt.toISOString()
      : new Date(image.createdAt).toISOString()
  }
}

// ============================================================
// FILE STORAGE (Local Only - Step 5)
// ============================================================

/**
 * Save file to local disk
 * Returns: path relative to uploads directory
 */
async function saveFileToDisk(
  file: MulterFile,
  productId: number
): Promise<string> {
  const uploadDir = join(process.cwd(), "uploads", "products", String(productId))
  await mkdir(uploadDir, { recursive: true })

  const ext = extname(file.originalname)
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`
  const filepath = join(uploadDir, filename)

  await writeFile(filepath, file.buffer)

  return `uploads/products/${productId}/${filename}`
}

/**
 * Delete file from local disk
 */
async function deleteFileFromDisk(relativePath: string): Promise<void> {
  const filepath = join(process.cwd(), relativePath)
  try {
    await unlink(filepath)
  } catch {
    // File tidak ada, skip silently
    console.log(`[FILE DELETE SKIPPED] ${relativePath} not found`)
  }
}

/**
 * Get next position for new image
 */
async function getNextPosition(productId: number): Promise<number> {
  const maxPosition = await prisma.productImage.aggregate({
    where: { productId },
    _max: { position: true }
  })

  return (maxPosition._max.position ?? -1) + 1
}

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * GET /products/:id/images
 * Retrieve all images for a product
 * Public - siapa saja bisa lihat
 */
export async function getProductImages(
  productId: number
): Promise<ProductImageListResponseDTO> {
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" }
  })

  const normalized = images.map(normalizeImage)
  const primaryImage = normalized.find(img => img.isPrimary) ?? null

  return {
    success: true,
    data: normalized,
    primaryImage,
    totalImages: normalized.length
  }
}

/**
 * GET /products/:id/images/:imageId
 * Retrieve single image
 */
export async function getImageById(
  productId: number,
  imageId: number
): Promise<ProductImageResponseDTO | null> {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId }
  })

  if (!image || image.productId !== productId) {
    return null
  }

  return normalizeImage(image)
}

// ============================================================
// WRITE OPERATIONS
// ============================================================

/**
 * UPLOAD IMAGE
 * 
 * Flow:
 * 1. Ownership check
 * 2. Validate file (mime, size)
 * 3. Check image count
 * 4. Save file to disk
 * 5. Save metadata to DB
 * 6. Handle primary image logic
 * 7. Audit trail
 */
export async function uploadImage(
  productId: number,
  file: MulterFile,
  options: { isPrimary?: boolean },
  user: AuthenticatedUser
): Promise<ImageUploadResponseDTO> {
  // 1. Ownership check
  await assertOwnership(productId, user)

  // 2. Validate file
  assertValidMimeType(file.mimetype)
  assertValidFileSize(file.size)

  // 3. Check image count
  await assertCanAddImage(productId)

  // 4. Execute in transaction
  const image = await TransactionManager.withTransaction(
    async (tx) => {
      // 5. Handle primary image - unset existing if needed
      if (options.isPrimary) {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false }
        })
      }

      // 6. Save file to disk
      const relativePath = await saveFileToDisk(file, productId)

      // 7. Get next position
      const position = await getNextPosition(productId)

      // 8. Save metadata
      const newImage = await tx.productImage.create({
        data: {
          productId,
          path: relativePath,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          position,
          isPrimary: options.isPrimary ?? false
        }
      })

      // 9. Audit trail
      await tx.audit.create({
        data: {
          action: "UPLOAD_PRODUCT_IMAGE",
          entityType: "ProductImage",
          entityId: newImage.id,
          data: JSON.stringify({
            type: "CREATE",
            productId,
            filename: file.originalname,
            size: file.size
          }),
          createdAt: new Date()
        }
      })

      return newImage
    },
    [CacheKey.productsList, CacheKey.productDetail(productId)]
  )

  return {
    success: true,
    data: normalizeImage(image),
    message: "Gambar berhasil diupload"
  }
}

/**
 * DELETE IMAGE
 * 
 * Flow:
 * 1. Ownership + image exists check
 * 2. Delete file from disk
 * 3. Delete metadata from DB
 * 4. Audit trail
 */
export async function deleteImage(
  productId: number,
  imageId: number,
  user: AuthenticatedUser
): Promise<ImageDeleteResponseDTO> {
  // 1. Ownership + exists check
  const image = await assertImageOwnership(productId, imageId, user)

  // 2. Execute in transaction
  await TransactionManager.withTransaction(
    async (tx) => {
      // 3. Delete from DB
      await tx.productImage.delete({ where: { id: imageId } })

      // 4. Audit trail
      await tx.audit.create({
        data: {
          action: "DELETE_PRODUCT_IMAGE",
          entityType: "ProductImage",
          entityId: imageId,
          data: JSON.stringify({
            type: "DELETE",
            productId,
            wasPrimary: image.isPrimary
          }),
          createdAt: new Date()
        }
      })

      return image
    },
    [CacheKey.productsList, CacheKey.productDetail(productId)]
  )

  // 5. Delete file from disk (after transaction)
  await deleteFileFromDisk(image.path)

  return {
    success: true,
    message: "Gambar berhasil dihapus",
    deletedId: imageId
  }
}

/**
 * REORDER IMAGES
 * 
 * Flow:
 * 1. Ownership check
 * 2. Validate all imageIds belong to product
 * 3. Update positions in transaction
 * 4. Audit trail
 */
export async function reorderImages(
  productId: number,
  imagePositions: Array<{ imageId: number; position: number }>,
  user: AuthenticatedUser
): Promise<ImageReorderResponseDTO> {
  // 1. Ownership check
  await assertOwnership(productId, user)

  // 2. Validate all images belong to product
  const imageIds = imagePositions.map(ip => ip.imageId)
  await assertImagesBelongToProduct(productId, imageIds)

  // 3. Execute in transaction
  const images = await TransactionManager.withTransaction(
    async (tx) => {
      // Update each image position
      const updatePromises = imagePositions.map(({ imageId, position }) =>
        tx.productImage.update({
          where: { id: imageId },
          data: { position }
        })
      )

      const updatedImages = await Promise.all(updatePromises)

      // Audit trail
      await tx.audit.create({
        data: {
          action: "REORDER_PRODUCT_IMAGES",
          entityType: "ProductImage",
          entityId: productId,
          data: JSON.stringify({
            type: "REORDER",
            productId,
            newOrder: imagePositions
          }),
          createdAt: new Date()
        }
      })

      return updatedImages
    },
    [CacheKey.productDetail(productId)]
  )

  // Sort by position for response
  const sortedImages = [...images].sort((a, b) => a.position - b.position)

  return {
    success: true,
    data: sortedImages.map(normalizeImage),
    message: "Urutan gambar berhasil diperbarui"
  }
}

/**
 * SET PRIMARY IMAGE
 * 
 * Flow:
 * 1. Ownership + image exists check
 * 2. Unset current primary
 * 3. Set new primary
 * 4. Audit trail
 */
export async function setPrimaryImage(
  productId: number,
  imageId: number,
  user: AuthenticatedUser
): Promise<ImageUploadResponseDTO> {
  // 1. Ownership + exists check
  await assertImageOwnership(productId, imageId, user)

  // 2. Execute in transaction
  const image = await TransactionManager.withTransaction(
    async (tx) => {
      // 3. Unset all primaries
      await tx.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false }
      })

      // 4. Set new primary
      const updatedImage = await tx.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true }
      })

      // 5. Audit trail
      await tx.audit.create({
        data: {
          action: "SET_PRIMARY_IMAGE",
          entityType: "ProductImage",
          entityId: imageId,
          data: JSON.stringify({
            type: "UPDATE",
            productId,
            imageId,
            action: "set_primary"
          }),
          createdAt: new Date()
        }
      })

      return updatedImage
    },
    [CacheKey.productDetail(productId)]
  )

  return {
    success: true,
    data: normalizeImage(image),
    message: "Gambar utama berhasil diperbarui"
  }
}