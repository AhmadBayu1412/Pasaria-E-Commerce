// ============================================================
// ORDER RULES - UNIT TESTS
// Phase 4 Step 6: Order Draft Foundation
// ============================================================

import { describe, it, expect } from "vitest"
import { OrderRules } from "../../../modules/order/order.rules.js"
import { BusinessError } from "../../../shared/errors/business.error.js"

describe("OrderRules", () => {
  describe("assertPreviewValid", () => {
    it("should pass when preview validation passed", () => {
      // Arrange
      const preview = {
        summary: { cartId: 1, userId: 1, totalQuantity: 1, totalItemCount: 1, subtotal: 100, isReady: true },
        items: [],
        validation: { passed: true, failedItems: [] },
      }

      // Act & Assert
      expect(() => OrderRules.assertPreviewValid(preview)).not.toThrow()
    })

    it("should throw when preview validation failed", () => {
      // Arrange
      const preview = {
        summary: { cartId: 1, userId: 1, totalQuantity: 0, totalItemCount: 0, subtotal: 0, isReady: false },
        items: [],
        validation: { passed: false, failedItems: [1] },
      }

      // Act & Assert
      expect(() => OrderRules.assertPreviewValid(preview)).toThrow(BusinessError)
    })
  })

  describe("assertPreviewHasItems", () => {
    it("should pass when preview has valid items", () => {
      // Arrange
      const preview = {
        summary: { cartId: 1, userId: 1, totalQuantity: 1, totalItemCount: 1, subtotal: 100, isReady: true },
        items: [
          { productId: 1, productName: "Test", unitPrice: 100, quantity: 1, availableStock: 10, subtotal: 100, status: "VALID" as const },
        ],
        validation: { passed: true, failedItems: [] },
      }

      // Act & Assert
      expect(() => OrderRules.assertPreviewHasItems(preview)).not.toThrow()
    })

    it("should throw when preview has no valid items", () => {
      // Arrange
      const preview = {
        summary: { cartId: 1, userId: 1, totalQuantity: 1, totalItemCount: 1, subtotal: 0, isReady: false },
        items: [
          { productId: 1, productName: "Test", unitPrice: 100, quantity: 1, availableStock: 0, subtotal: 100, status: "INVALID" as const, reason: "OUT_OF_STOCK" as const },
        ],
        validation: { passed: false, failedItems: [1] },
      }

      // Act & Assert
      expect(() => OrderRules.assertPreviewHasItems(preview)).toThrow(BusinessError)
    })
  })

  describe("assertOrderNotEmpty", () => {
    it("should pass when item count > 0", () => {
      expect(() => OrderRules.assertOrderNotEmpty(1)).not.toThrow()
    })

    it("should throw when item count = 0", () => {
      expect(() => OrderRules.assertOrderNotEmpty(0)).toThrow(BusinessError)
    })
  })
})
