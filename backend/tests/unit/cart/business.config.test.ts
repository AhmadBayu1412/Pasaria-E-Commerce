// ============================================================
// BUSINESS CONFIG UNIT TESTS
// Phase 4 Step 1
// ============================================================

import { describe, it, expect } from "vitest"
import { BUSINESS_LIMITS, isWithinCartLimit } from "../../../shared/config/business.config.js"

describe("BusinessLimits", () => {

  describe("MAX_CART_ITEM_QUANTITY", () => {
    it("should be 99", () => {
      expect(BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY).toBe(99)
    })

    it("should be positive", () => {
      expect(BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY).toBeGreaterThan(0)
    })

    it("should be integer", () => {
      expect(BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY % 1).toBe(0)
    })
  })

  describe("isWithinCartLimit", () => {
    it("should return true for valid quantity (1)", () => {
      expect(isWithinCartLimit(1)).toBe(true)
    })

    it("should return true for valid quantity (50)", () => {
      expect(isWithinCartLimit(50)).toBe(true)
    })

    it("should return true for valid quantity (99)", () => {
      expect(isWithinCartLimit(99)).toBe(true)
    })

    it("should return false for zero", () => {
      expect(isWithinCartLimit(0)).toBe(false)
    })

    it("should return false for negative", () => {
      expect(isWithinCartLimit(-1)).toBe(false)
    })

    it("should return false for quantity > 99", () => {
      expect(isWithinCartLimit(100)).toBe(false)
    })

    it("should return false for very large number", () => {
      expect(isWithinCartLimit(999999)).toBe(false)
    })
  })
})
