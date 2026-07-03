// ============================================================
// CHECKOUT SERVICE - UNIT TESTS
// Phase 4 Step 5: Checkout Orchestration Foundation
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest"
import { CheckoutService } from "../../../modules/checkout/checkout.service"
import { BusinessError } from "../../../shared/errors/business.error"

// Mock dependencies
vi.mock("../../../modules/cart/services/cart.service", () => ({
  CartService: {
    getCartSnapshot: vi.fn(),
  },
}))

vi.mock("../../../modules/inventory/inventory.service", () => ({
  InventoryService: {
    validateCartItemForCheckout: vi.fn(),
  },
}))

import { CartService } from "../../../modules/cart/services/cart.service"
import { InventoryService } from "../../../modules/inventory/inventory.service"

describe("CheckoutService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initiateCheckout", () => {
    const mockUserId = 1

    it("should return preview when all items are available", async () => {
      // Arrange
      const mockCartSnapshot = {
        cartId: 10,
        userId: mockUserId,
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
        totalQuantity: 3,
      }

      const mockInventoryResults = [
        { productId: 1, requestedQuantity: 2, availableStock: 10, status: "VALID" as const, reason: undefined },
        { productId: 2, requestedQuantity: 1, availableStock: 5, status: "VALID" as const, reason: undefined },
      ]

      vi.mocked(CartService.getCartSnapshot).mockResolvedValue(mockCartSnapshot)
      vi.mocked(InventoryService.validateCartItemForCheckout)
        .mockResolvedValueOnce(mockInventoryResults[0])
        .mockResolvedValueOnce(mockInventoryResults[1])

      // Act
      const result = await CheckoutService.initiateCheckout({ userId: mockUserId })

      // Assert
      expect(CartService.getCartSnapshot).toHaveBeenCalledWith(mockUserId)
      expect(InventoryService.validateCartItemForCheckout).toHaveBeenCalledTimes(2)
      expect(result.summary.cartId).toBe(10)
      expect(result.summary.isReady).toBe(true)
      expect(result.summary.totalQuantity).toBe(3)
      expect(result.items).toHaveLength(2)
      expect(result.validation.passed).toBe(true)
    })

    it("should throw CART_EMPTY when cart has no items", async () => {
      // Arrange
      const mockCartSnapshot = {
        cartId: null,
        userId: mockUserId,
        items: [],
        totalQuantity: 0,
      }

      vi.mocked(CartService.getCartSnapshot).mockResolvedValue(mockCartSnapshot)

      // Act & Assert
      await expect(CheckoutService.initiateCheckout({ userId: mockUserId }))
        .rejects.toThrow(BusinessError)

      try {
        await CheckoutService.initiateCheckout({ userId: mockUserId })
      } catch (error) {
        expect((error as BusinessError).code).toBe("CART_EMPTY")
      }
    })

    it("should throw CHECKOUT_UNAVAILABLE_ITEMS when one item is out of stock", async () => {
      // Arrange
      const mockCartSnapshot = {
        cartId: 10,
        userId: mockUserId,
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
        totalQuantity: 3,
      }

      const mockInventoryResults = [
        { productId: 1, requestedQuantity: 2, availableStock: 10, status: "VALID" as const, reason: undefined },
        { productId: 2, requestedQuantity: 1, availableStock: 0, status: "INVALID" as const, reason: "OUT_OF_STOCK" as const },
      ]

      vi.mocked(CartService.getCartSnapshot).mockResolvedValue(mockCartSnapshot)
      vi.mocked(InventoryService.validateCartItemForCheckout)
        .mockResolvedValueOnce(mockInventoryResults[0])
        .mockResolvedValueOnce(mockInventoryResults[1])

      // Act & Assert
      try {
        await CheckoutService.initiateCheckout({ userId: mockUserId })
        expect.fail("Should have thrown")
      } catch (error) {
        expect((error as BusinessError).code).toBe("CHECKOUT_UNAVAILABLE_ITEMS")
        expect((error as BusinessError).message).toContain("2")  // productId 2 failed
      }
    })

    it("should throw CHECKOUT_UNAVAILABLE_ITEMS when product not found", async () => {
      // Arrange
      const mockCartSnapshot = {
        cartId: 10,
        userId: mockUserId,
        items: [
          { productId: 999, quantity: 1 },
        ],
        totalQuantity: 1,
      }

      const mockInventoryResults = [
        { productId: 999, requestedQuantity: 1, availableStock: 0, status: "INVALID" as const, reason: "PRODUCT_NOT_FOUND" as const },
      ]

      vi.mocked(CartService.getCartSnapshot).mockResolvedValue(mockCartSnapshot)
      vi.mocked(InventoryService.validateCartItemForCheckout)
        .mockResolvedValueOnce(mockInventoryResults[0])

      // Act & Assert
      try {
        await CheckoutService.initiateCheckout({ userId: mockUserId })
        expect.fail("Should have thrown")
      } catch (error) {
        expect((error as BusinessError).code).toBe("CHECKOUT_UNAVAILABLE_ITEMS")
      }
    })

    it("should call CartService.getCartSnapshot exactly once", async () => {
      // Arrange
      const mockCartSnapshot = {
        cartId: 10,
        userId: mockUserId,
        items: [{ productId: 1, quantity: 1 }],
        totalQuantity: 1,
      }

      vi.mocked(CartService.getCartSnapshot).mockResolvedValue(mockCartSnapshot)
      vi.mocked(InventoryService.validateCartItemForCheckout).mockResolvedValue({
        productId: 1,
        requestedQuantity: 1,
        availableStock: 10,
        status: "VALID" as const,
        reason: undefined,
      })

      // Act
      await CheckoutService.initiateCheckout({ userId: mockUserId })

      // Assert
      expect(CartService.getCartSnapshot).toHaveBeenCalledTimes(1)
      expect(CartService.getCartSnapshot).toHaveBeenCalledWith(mockUserId)
    })

    it("should call InventoryService.validateCartItemForCheckout for each cart item", async () => {
      // Arrange
      const mockCartSnapshot = {
        cartId: 10,
        userId: mockUserId,
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 3 },
          { productId: 3, quantity: 1 },
        ],
        totalQuantity: 6,
      }

      vi.mocked(CartService.getCartSnapshot).mockResolvedValue(mockCartSnapshot)
      vi.mocked(InventoryService.validateCartItemForCheckout).mockResolvedValue({
        productId: 1,
        requestedQuantity: 1,
        availableStock: 10,
        status: "VALID" as const,
        reason: undefined,
      })

      // Act
      await CheckoutService.initiateCheckout({ userId: mockUserId })

      // Assert
      expect(InventoryService.validateCartItemForCheckout).toHaveBeenCalledTimes(3)
    })
  })
})
