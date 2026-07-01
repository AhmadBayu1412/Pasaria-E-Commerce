import { describe, it, expect } from "vitest"
import {
  uploadImageSchema,
  reorderImagesSchema,
  IMAGE_CONFIG,
  isAllowedMimeType,
  getAllowedMimeTypes
} from "../../../modules/product/validation/image.validation"

describe("Image Validation", () => {

  describe("uploadImageSchema", () => {
    it("should accept valid isPrimary boolean", () => {
      const result = uploadImageSchema.safeParse({ isPrimary: true })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isPrimary).toBe(true)
      }
    })

    it("should default isPrimary to false", () => {
      const result = uploadImageSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isPrimary).toBe(false)
      }
    })

    it("should reject non-boolean isPrimary", () => {
      const result = uploadImageSchema.safeParse({ isPrimary: "yes" })
      expect(result.success).toBe(false)
    })
  })

  describe("reorderImagesSchema", () => {
    it("should accept valid image positions", () => {
      const result = reorderImagesSchema.safeParse({
        imagePositions: [
          { imageId: 1, position: 0 },
          { imageId: 2, position: 1 }
        ]
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty array", () => {
      const result = reorderImagesSchema.safeParse({
        imagePositions: []
      })
      expect(result.success).toBe(false)
    })

    it("should reject negative position", () => {
      const result = reorderImagesSchema.safeParse({
        imagePositions: [{ imageId: 1, position: -1 }]
      })
      expect(result.success).toBe(false)
    })

    it("should reject non-positive imageId", () => {
      const result = reorderImagesSchema.safeParse({
        imagePositions: [{ imageId: 0, position: 0 }]
      })
      expect(result.success).toBe(false)
    })
  })

  describe("isAllowedMimeType", () => {
    it("should return true for allowed types", () => {
      expect(isAllowedMimeType("image/jpeg")).toBe(true)
      expect(isAllowedMimeType("image/png")).toBe(true)
      expect(isAllowedMimeType("image/webp")).toBe(true)
    })

    it("should return false for disallowed types", () => {
      expect(isAllowedMimeType("image/gif")).toBe(false)
      expect(isAllowedMimeType("application/pdf")).toBe(false)
      expect(isAllowedMimeType("text/plain")).toBe(false)
    })
  })

  describe("IMAGE_CONFIG", () => {
    it("should have correct max file size", () => {
      expect(IMAGE_CONFIG.MAX_FILE_SIZE).toBe(5 * 1024 * 1024)
    })

    it("should have correct max images per product", () => {
      expect(IMAGE_CONFIG.MAX_IMAGES_PER_PRODUCT).toBe(10)
    })

    it("should have allowed mime types", () => {
      const types = getAllowedMimeTypes()
      expect(types).toContain("image/jpeg")
      expect(types).toContain("image/png")
      expect(types).toContain("image/webp")
    })
  })
})