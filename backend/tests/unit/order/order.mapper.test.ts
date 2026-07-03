// ============================================================
// ORDER MAPPER - UNIT TESTS
// Phase 4 Step 6: Order Draft Foundation
// ============================================================

import { describe, it, expect } from "vitest"
import { OrderMapper } from "../../../modules/order/order.mapper.js"

describe("OrderMapper", () => {
  describe("toOrderItemData", () => {
    it("should transform checkout item to order item data", () => {
      // Arrange
      const checkoutItem = {
        productId: 1,
        productName: "Laptop",
        unitPrice: 10000000,
        quantity: 2,
        availableStock: 10,
        subtotal: 20000000,
        status: "VALID" as const,
      }

      // Act
      const result = OrderMapper.toOrderItemData(checkoutItem)

      // Assert
      expect(result.productId).toBe(1)
      expect(result.productName).toBe("Laptop")
      expect(result.unitPrice).toBe(10000000)
      expect(result.quantity).toBe(2)
      expect(result.subtotal).toBe(20000000)
    })
  })

  describe("calculateTotals", () => {
    it("should calculate totals correctly", () => {
      // Arrange
      const items = [
        { productId: 1, productName: "Laptop", unitPrice: 10000000, quantity: 2, subtotal: 20000000 },
        { productId: 2, productName: "Mouse", unitPrice: 500000, quantity: 3, subtotal: 1500000 },
      ]

      // Act
      const result = OrderMapper.calculateTotals(items)

      // Assert
      expect(result.totalQuantity).toBe(5)
      expect(result.totalItemCount).toBe(2)
      expect(result.subtotal).toBe(21500000)
    })

    it("should return zero totals for empty array", () => {
      // Act
      const result = OrderMapper.calculateTotals([])

      // Assert
      expect(result.totalQuantity).toBe(0)
      expect(result.totalItemCount).toBe(0)
      expect(result.subtotal).toBe(0)
    })
  })
})
