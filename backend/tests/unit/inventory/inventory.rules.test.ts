// ============================================================
// INVENTORY RULES UNIT TESTS
// Phase 4 Step 4: Inventory Foundation
// ============================================================

import { describe, it, expect } from "vitest"
import { InventoryRules } from "../../../modules/inventory/inventory.rules.js"
import { BusinessError } from "../../../shared/errors/business.error.js"

describe("InventoryRules", () => {

  describe("assertValidQuantity", () => {

    it("should pass for quantity = 1", () => {
      expect(() => InventoryRules.assertValidQuantity(1)).not.toThrow()
    })

    it("should pass for quantity = 99", () => {
      expect(() => InventoryRules.assertValidQuantity(99)).not.toThrow()
    })

    it("should pass for quantity = 50", () => {
      expect(() => InventoryRules.assertValidQuantity(50)).not.toThrow()
    })

    it("should throw for quantity = 0", () => {
      expect(() => InventoryRules.assertValidQuantity(0)).toThrow(BusinessError)
    })

    it("should throw for negative quantity", () => {
      expect(() => InventoryRules.assertValidQuantity(-1)).toThrow(BusinessError)
    })

    it("should throw for quantity > 99", () => {
      expect(() => InventoryRules.assertValidQuantity(100)).toThrow(BusinessError)
    })

    it("should throw INVALID_QUANTITY for qty < 1", () => {
      try {
        InventoryRules.assertValidQuantity(0)
      } catch (e) {
        expect((e as BusinessError).code).toBe("INVALID_QUANTITY")
      }
    })

    it("should throw QUANTITY_EXCEEDS_LIMIT for qty > 99", () => {
      try {
        InventoryRules.assertValidQuantity(100)
      } catch (e) {
        expect((e as BusinessError).code).toBe("QUANTITY_EXCEEDS_LIMIT")
      }
    })
  })

  describe("assertStockAvailable", () => {

    it("should pass when available >= quantity", () => {
      expect(() => InventoryRules.assertStockAvailable(10, 5)).not.toThrow()
    })

    it("should pass when available = quantity (exact)", () => {
      expect(() => InventoryRules.assertStockAvailable(5, 5)).not.toThrow()
    })

    it("should throw when available < quantity", () => {
      expect(() => InventoryRules.assertStockAvailable(5, 10)).toThrow(BusinessError)
    })

    it("should throw when available = 0", () => {
      expect(() => InventoryRules.assertStockAvailable(0, 1)).toThrow(BusinessError)
    })

    it("should throw with INSUFFICIENT_STOCK code", () => {
      try {
        InventoryRules.assertStockAvailable(5, 10)
      } catch (e) {
        expect((e as BusinessError).code).toBe("INSUFFICIENT_STOCK")
      }
    })

    it("should throw for quantity = 0 (before stock check)", () => {
      // Order of validation: quantity first
      expect(() => InventoryRules.assertStockAvailable(10, 0)).toThrow(BusinessError)
    })

    it("should provide clear error message", () => {
      try {
        InventoryRules.assertStockAvailable(5, 10)
      } catch (e) {
        const err = e as BusinessError
        expect(err.message).toContain("Available: 5")
        expect(err.message).toContain("Requested: 10")
      }
    })
  })

  describe("Boundary Cases", () => {

    it("should handle large available stock", () => {
      expect(() => InventoryRules.assertStockAvailable(10000, 99)).not.toThrow()
    })

    it("should handle zero available stock", () => {
      expect(() => InventoryRules.assertStockAvailable(0, 1)).toThrow(BusinessError)
    })

    it("should handle exact boundary: qty = 99, stock = 99", () => {
      expect(() => InventoryRules.assertStockAvailable(99, 99)).not.toThrow()
    })

    it("should handle boundary: qty = 99, stock = 98", () => {
      expect(() => InventoryRules.assertStockAvailable(98, 99)).toThrow(BusinessError)
    })
  })
})
