// ============================================================
// CART RULES UNIT TESTS
// Phase 4 Step 1
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
  describe("assertQuantityValid", () => {

    it("should not throw for valid quantity (1)", () => {
      expect(() => CartRules.assertQuantityValid(1)).not.toThrow()
    })

    it("should not throw for valid quantity (50)", () => {
      expect(() => CartRules.assertQuantityValid(50)).not.toThrow()
    })

    it("should not throw for valid quantity (99)", () => {
      expect(() => CartRules.assertQuantityValid(99)).not.toThrow()
    })

    it("should throw BusinessError for zero quantity", () => {
      expect(() => CartRules.assertQuantityValid(0)).toThrow(BusinessError)
      try {
        CartRules.assertQuantityValid(0)
      } catch (e) {
        expect((e as BusinessError).code).toBe("INVALID_QUANTITY")
      }
    })

    it("should throw BusinessError for negative quantity", () => {
      expect(() => CartRules.assertQuantityValid(-1)).toThrow(BusinessError)
    })

    it("should throw BusinessError for quantity exceeding 99", () => {
      expect(() => CartRules.assertQuantityValid(100)).toThrow(BusinessError)
      try {
        CartRules.assertQuantityValid(100)
      } catch (e) {
        expect((e as BusinessError).code).toBe("QUANTITY_EXCEEDS_LIMIT")
      }
    })

    it("should throw BusinessError with correct status code", () => {
      try {
        CartRules.assertQuantityValid(0)
      } catch (e) {
        expect((e as BusinessError).statusCode).toBe(400)
      }
    })

    it("should throw BusinessError for very large quantity", () => {
      expect(() => CartRules.assertQuantityValid(999999)).toThrow(BusinessError)
    })
  })
})
