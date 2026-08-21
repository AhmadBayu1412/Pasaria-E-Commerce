// modules/product/validation/image.validation.ts

import { z } from "zod"

// ============================================================
// IMAGE VALIDATION SCHEMAS (Phase 3 Step 5)
// ============================================================

// ===== Config =====
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_IMAGES_PER_PRODUCT = 10

// ===== Upload Image Schema =====
/**
 * POST /products/:id/images
 * productId dari route param, bukan body
 */
export const uploadImageSchema = z.object({
  isPrimary: z.boolean().optional().default(false)
})

export type UploadImageInput = z.infer<typeof uploadImageSchema>

// ===== Reorder Images Schema =====
/**
 * PATCH /products/:id/images/reorder
 * Array of imageId dengan posisi baru
 */
export const reorderImagesSchema = z.object({
  imagePositions: z.array(
    z.object({
      imageId: z.number().int().positive("Image ID harus bilangan bulat positif"),
      position: z.number().int().min(0, "Position tidak boleh negatif")
    })
  ).min(1, "Minimal 1 image untuk reorder")
    .max(MAX_IMAGES_PER_PRODUCT, `Maksimal ${MAX_IMAGES_PER_PRODUCT} images`)
})

export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>

// ===== Config Exports =====
export const IMAGE_CONFIG = {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGES_PER_PRODUCT,
  MAX_FILE_SIZE_DISPLAY: "5MB"
} as const

// ===== Validation Helpers =====
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])
}

export function getAllowedMimeTypes(): readonly string[] {
  return ALLOWED_MIME_TYPES
}