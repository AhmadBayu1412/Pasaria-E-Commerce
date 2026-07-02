import { describe, it, expect } from "vitest"
import {
  ProductReindexJobSchema,
  QueueJobDataSchema,
  isValidJob,
  parseJobData
} from "../../../shared/queue/queue.types.js"

describe("Queue Types", () => {

  describe("ProductReindexJobSchema", () => {
    it("should validate correct job data", () => {
      const valid = {
        type: "product_reindex",
        productId: 123
      }

      const result = ProductReindexJobSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it("should accept timestamp if provided", () => {
      const valid = {
        type: "product_reindex",
        productId: 123,
        timestamp: Date.now()
      }

      const result = ProductReindexJobSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it("should reject invalid productId", () => {
      const invalid = {
        type: "product_reindex",
        productId: -1
      }

      const result = ProductReindexJobSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it("should reject wrong type", () => {
      const invalid = {
        type: "unknown_job",
        productId: 123
      }

      const result = ProductReindexJobSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it("should reject missing required fields", () => {
      const invalid = {
        type: "product_reindex"
      }

      const result = ProductReindexJobSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it("should reject string productId", () => {
      const invalid = {
        type: "product_reindex",
        productId: "123"
      }

      const result = ProductReindexJobSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it("should reject zero productId", () => {
      const invalid = {
        type: "product_reindex",
        productId: 0
      }

      const result = ProductReindexJobSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe("QueueJobDataSchema", () => {
    it("should validate discriminated union with product_reindex", () => {
      const valid = {
        type: "product_reindex",
        productId: 456
      }

      const result = QueueJobDataSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })
  })

  describe("isValidJob()", () => {
    it("should return true for valid job data", () => {
      const valid = {
        type: "product_reindex",
        productId: 123
      }

      expect(isValidJob(valid)).toBe(true)
    })

    it("should return false for invalid job data", () => {
      expect(isValidJob({ type: "invalid" })).toBe(false)
    })

    it("should return false for null", () => {
      expect(isValidJob(null)).toBe(false)
    })

    it("should return false for undefined", () => {
      expect(isValidJob(undefined)).toBe(false)
    })

    it("should return false for empty object", () => {
      expect(isValidJob({})).toBe(false)
    })

    it("should return false for array", () => {
      expect(isValidJob([])).toBe(false)
    })
  })

  describe("parseJobData()", () => {
    it("should parse valid job data", () => {
      const input = {
        type: "product_reindex",
        productId: 456
      }

      const result = parseJobData(input)

      expect(result.type).toBe("product_reindex")
      expect(result.productId).toBe(456)
      expect(result.timestamp).toBeDefined()
    })

    it("should throw for invalid job data", () => {
      expect(() => parseJobData({ type: "invalid" })).toThrow()
    })

    it("should include default timestamp", () => {
      const before = Date.now()
      const result = parseJobData({
        type: "product_reindex",
        productId: 789
      })
      const after = Date.now()

      expect(result.timestamp).toBeGreaterThanOrEqual(before)
      expect(result.timestamp).toBeLessThanOrEqual(after)
    })
  })
})
