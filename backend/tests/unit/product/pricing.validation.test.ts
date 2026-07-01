import { describe, it, expect } from "vitest"
import {
  updatePricingSchema,
  PRICING_CONFIG
} from "../../../modules/product/validation/pricing.validation"

describe("Pricing Validation", () => {

  describe("updatePricingSchema", () => {
    it("should accept valid base price", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 120000
      })
      expect(result.success).toBe(true)
    })

    it("should accept valid base price with decimals", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 120000.99
      })
      expect(result.success).toBe(true)
    })

    it("should accept null discount price", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 120000,
        discountPrice: null
      })
      expect(result.success).toBe(true)
    })

    it("should accept valid discount price", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 120000,
        discountPrice: 100000
      })
      expect(result.success).toBe(true)
    })

    it("should reject zero base price", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 0
      })
      expect(result.success).toBe(false)
    })

    it("should reject negative base price", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: -1000
      })
      expect(result.success).toBe(false)
    })

    it("should reject negative discount price", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 120000,
        discountPrice: -1000
      })
      expect(result.success).toBe(false)
    })

    it("should accept discount exceeding base price in schema", () => {
      // Note: Cross-field validation (discount <= base) dilakukan di rules layer
      // Schema hanya validasi individual fields
      const result = updatePricingSchema.safeParse({
        basePrice: 100000,
        discountPrice: 150000
      })
      // Schema accepts this - validation will fail in rules
      expect(result.success).toBe(true)
    })

    it("should reject more than 2 decimal places", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 100.123
      })
      expect(result.success).toBe(false)
    })

    it("should accept optional reason field", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 120000,
        reason: "Seasonal discount"
      })
      expect(result.success).toBe(true)
    })

    it("should accept equal base and discount price", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 100000,
        discountPrice: 100000
      })
      expect(result.success).toBe(true)
    })

    it("should accept optional discountPrice (undefined)", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 120000
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.discountPrice).toBeUndefined()
      }
    })

    it("should reject price exceeding max", () => {
      const result = updatePricingSchema.safeParse({
        basePrice: 1_000_000_000_000
      })
      expect(result.success).toBe(false)
    })
  })

  describe("PRICING_CONFIG", () => {
    it("should have correct currency", () => {
      expect(PRICING_CONFIG.CURRENCY).toBe("IDR")
    })

    it("should have correct max price", () => {
      expect(PRICING_CONFIG.PRICE_MAX).toBe(999_999_999_999)
    })

    it("should have correct decimal precision", () => {
      expect(PRICING_CONFIG.DECIMAL_PRECISION).toBe(2)
    })
  })
})
