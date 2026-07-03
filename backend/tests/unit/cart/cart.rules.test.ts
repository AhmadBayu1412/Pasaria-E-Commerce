// ============================================================
// CART RULES UNIT TESTS
// Phase 4 Step 2: Add To Cart
// Tests database-independent rule logic only
// ============================================================

import { describe, it, expect } from "vitest"
import { CartRules } from "../../../modules/cart/rules/cart.rules.js"
import { BusinessError } from "../../../shared/errors/business.error.js"

describe("CartRules", () => {

  // ============================================================
  // Quantity Validation Tests
  // (These don't require database)
  // ============================================================
  describe("assertQuantityWithinLimit", () => {

    it("should not throw for valid quantity (1)", () => {
      expect(() => CartRules.assertQuantityWithinLimit(1)).not.toThrow()
    })

    it("should not throw for valid quantity (50)", () => {
      expect(() => CartRules.assertQuantityWithinLimit(50)).not.toThrow()
    })

    it("should not throw for valid quantity (99)", () => {
      expect(() => CartRules.assertQuantityWithinLimit(99)).not.toThrow()
    })

    it("should throw BusinessError for zero quantity", () => {
      expect(() => CartRules.assertQuantityWithinLimit(0)).toThrow(BusinessError)
      try {
        CartRules.assertQuantityWithinLimit(0)
      } catch (e) {
        expect((e as BusinessError).code).toBe("INVALID_QUANTITY")
      }
    })

    it("should throw BusinessError for negative quantity", () => {
      expect(() => CartRules.assertQuantityWithinLimit(-1)).toThrow(BusinessError)
    })

    it("should throw BusinessError for quantity exceeding 99", () => {
      expect(() => CartRules.assertQuantityWithinLimit(100)).toThrow(BusinessError)
      try {
        CartRules.assertQuantityWithinLimit(100)
      } catch (e) {
        expect((e as BusinessError).code).toBe("QUANTITY_EXCEEDS_LIMIT")
      }
    })

    it("should throw BusinessError with correct status code", () => {
      try {
        CartRules.assertQuantityWithinLimit(0)
      } catch (e) {
        expect((e as BusinessError).statusCode).toBe(400)
      }
    })

    it("should throw BusinessError for very large quantity", () => {
      expect(() => CartRules.assertQuantityWithinLimit(999999)).toThrow(BusinessError)
    })
  })

  describe("assertTotalQuantityWithinLimit", () => {

    it("should not throw when total is within limit", () => {
      expect(() => CartRules.assertTotalQuantityWithinLimit(50, 30)).not.toThrow()
    })

    it("should not throw when current + add = max", () => {
      expect(() => CartRules.assertTotalQuantityWithinLimit(49, 50)).not.toThrow()
    })

    it("should throw when total exceeds limit", () => {
      expect(() => CartRules.assertTotalQuantityWithinLimit(90, 20)).toThrow(BusinessError)
    })

    it("should throw when current already at max", () => {
      expect(() => CartRules.assertTotalQuantityWithinLimit(99, 1)).toThrow(BusinessError)
    })
  })
})
