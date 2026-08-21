// modules/product/controllers/image.controller.ts

// ============================================================
// IMAGE CONTROLLER (Phase 3 Step 5)
// HTTP concern only - no business logic
// ============================================================

import type { Request, Response, NextFunction } from "express"
import {
  getProductImages,
  getImageById,
  uploadImage,
  deleteImage,
  reorderImages,
  setPrimaryImage
} from "../services/image.service"
import type { AuthenticatedUser } from "../../../shared/session/session.types"
import {
  uploadImageSchema,
  reorderImagesSchema
} from "../validation/image.validation"
import { BusinessError } from "../../../shared/errors/business.error"

// ============================================================
// HELPERS
// ============================================================

function parseProductId(value: string | string[]): number | null {
  const str = Array.isArray(value) ? value[0] : value
  const id = parseInt(str, 10)
  return Number.isNaN(id) ? null : id
}

function parseImageId(value: string | string[]): number | null {
  const str = Array.isArray(value) ? value[0] : value
  const id = parseInt(str, 10)
  return Number.isNaN(id) ? null : id
}

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * GET /products/:id/images
 * Public - siapa saja bisa lihat gambar produk
 */
export async function getProductImagesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = parseProductId(req.params.id)

    if (productId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid product ID",
        code: "INVALID_ID"
      })
      return
    }

    const result = await getProductImages(productId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /products/:id/images/:imageId
 * Public
 */
export async function getImageByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = parseProductId(req.params.id)
    const imageId = parseImageId(req.params.imageId)

    if (productId === null || imageId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid ID format",
        code: "INVALID_ID"
      })
      return
    }

    const image = await getImageById(productId, imageId)

    if (!image) {
      res.status(404).json({
        success: false,
        error: "Image tidak ditemukan",
        code: "IMAGE_NOT_FOUND"
      })
      return
    }

    res.json({ success: true, data: image })
  } catch (err) {
    next(err)
  }
}

// ============================================================
// WRITE OPERATIONS
// ============================================================

/**
 * POST /products/:id/images
 * Protected - SELLER/ADMIN only
 * Multipart form upload with file
 */
export async function uploadImageController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = parseProductId(req.params.id)

    if (productId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid product ID",
        code: "INVALID_ID"
      })
      return
    }

    // Validate request body
    const bodyValidation = uploadImageSchema.safeParse(req.body)
    if (!bodyValidation.success) {
      res.status(400).json({
        success: false,
        error: "Invalid request body",
        errors: bodyValidation.error.flatten()
      })
      return
    }

    // Check file exists (Multer should handle this)
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "File image diperlukan",
        code: "FILE_REQUIRED"
      })
      return
    }

    const user = req.user as AuthenticatedUser
    const result = await uploadImage(
      productId,
      req.file,
      { isPrimary: bodyValidation.data.isPrimary },
      user
    )

    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /products/:id/images/:imageId
 * Protected - SELLER/ADMIN only (ownership check)
 */
export async function deleteImageController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = parseProductId(req.params.id)
    const imageId = parseImageId(req.params.imageId)

    if (productId === null || imageId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid ID format",
        code: "INVALID_ID"
      })
      return
    }

    const user = req.user as AuthenticatedUser
    const result = await deleteImage(productId, imageId, user)

    res.json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /products/:id/images/reorder
 * Protected - SELLER/ADMIN only
 * Body: { imagePositions: [{ imageId, position }] }
 */
export async function reorderImagesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = parseProductId(req.params.id)

    if (productId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid product ID",
        code: "INVALID_ID"
      })
      return
    }

    // Validate request body
    const validation = reorderImagesSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Invalid request body",
        errors: validation.error.flatten()
      })
      return
    }

    const user = req.user as AuthenticatedUser
    const result = await reorderImages(
      productId,
      validation.data.imagePositions,
      user
    )

    res.json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /products/:id/images/:imageId/primary
 * Protected - SELLER/ADMIN only
 * No request body needed
 */
export async function setPrimaryImageController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = parseProductId(req.params.id)
    const imageId = parseImageId(req.params.imageId)

    if (productId === null || imageId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid ID format",
        code: "INVALID_ID"
      })
      return
    }

    const user = req.user as AuthenticatedUser
    const result = await setPrimaryImage(productId, imageId, user)

    res.json(result)
  } catch (err) {
    next(err)
  }
}