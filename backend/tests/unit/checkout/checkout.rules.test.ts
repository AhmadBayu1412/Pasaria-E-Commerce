// ============================================================
// CHECKOUT RULES - UNIT TESTS
// Phase 4 Step 5: Checkout Orchestration Foundation
// ============================================================

import { describe, it, expect } from "vitest"
import { CheckoutRules } from "../../../modules/checkout/checkout.rules"
import { BusinessError } from "../../../shared/errors/business.error"

describe("CheckoutRules", () => {
  describe("assertCartNotEmpty", () => {
    it("should not throw when cart has items (totalQuantity > 0)", () => {
      expect(() => CheckoutRules.assertCartNotEmpty(5)).not.toThrow()
      expect(() => CheckoutRules.assertCartNotEmpty(1)).not.toThrow()
      expect(() => CheckoutRules.assertCartNotEmpty(99)).not.toThrow()
    })

    it("should throw BusinessError with code CART_EMPTY when cart is empty", () => {
      expect(() => CheckoutRules.assertCartNotEmpty(0)).toThrow(BusinessError)
      
      try {
        CheckoutRules.assertCartNotEmpty(0)
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessError)
        expect((error as BusinessError).code).toBe("CART_EMPTY")
        expect((error as BusinessError).message).toBe("Cart is empty")
        expect((error as BusinessError).statusCode).toBe(400)
      }
    })
  })
})
