// ============================================================
// ORDER SERVICE - UNIT TESTS
// Phase 4 Step 6: Order Draft Foundation
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest"
import { OrderService } from "../../../modules/order/order.service.js"
import { BusinessError } from "../../../shared/errors/business.error.js"

// Mock prisma
vi.mock("../../../infra/db/prisma.js", () => ({
  prisma: {
    order: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from "../../../infra/db/prisma.js"

describe("OrderService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createDraft", () => {
    const mockCheckoutPreview = {
      summary: {
        cartId: 1,
        userId: 1,
        totalQuantity: 3,
        totalItemCount: 2,
        subtotal: 20500000,
        isReady: true,
      },
      items: [
        {
          productId: 1,
          productName: "Laptop",
          unitPrice: 10000000,
          quantity: 2,
          availableStock: 10,
          subtotal: 20000000,
          status: "VALID" as const,
        },
        {
          productId: 2,
          productName: "Mouse",
          unitPrice: 500000,
          quantity: 1,
          availableStock: 50,
          subtotal: 500000,
          status: "VALID" as const,
        },
      ],
      validation: {
        passed: true,
        failedItems: [],
      },
    }

    it("should create order draft successfully", async () => {
      // Arrange
      const mockOrder = {
        id: 12,
        userId: 1,
        status: "DRAFT",
        totalQuantity: 3,
        totalItemCount: 2,
        subtotal: 20500000,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          { id: 1, productId: 1, productName: "Laptop", unitPrice: 10000000, quantity: 2, subtotal: 20000000, orderId: 12, createdAt: new Date() },
          { id: 2, productId: 2, productName: "Mouse", unitPrice: 500000, quantity: 1, subtotal: 500000, orderId: 12, createdAt: new Date() },
        ],
      }

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any)

      // Act
      const result = await OrderService.createDraft({ checkoutPreview: mockCheckoutPreview })

      // Assert
      expect(result.id).toBe(12)
      expect(result.status).toBe("DRAFT")
      expect(result.items).toHaveLength(2)
      expect(result.totalQuantity).toBe(3)
      expect(prisma.order.create).toHaveBeenCalledTimes(1)
    })

    it("should throw CHECKOUT_NOT_VALID when preview is invalid", async () => {
      // Arrange
      const invalidPreview = {
        ...mockCheckoutPreview,
        validation: { passed: false, failedItems: [1] },
      }

      // Act & Assert
      await expect(OrderService.createDraft({ checkoutPreview: invalidPreview }))
        .rejects.toThrow(BusinessError)
    })

    it("should throw ORDER_EMPTY when no valid items", async () => {
      // Arrange
      const emptyPreview = {
        ...mockCheckoutPreview,
        items: [],
      }

      // Act & Assert
      await expect(OrderService.createDraft({ checkoutPreview: emptyPreview }))
        .rejects.toThrow(BusinessError)
    })

    it("should filter out invalid items and create order with only valid items", async () => {
      // Arrange
      const mixedPreview = {
        ...mockCheckoutPreview,
        items: [
          { productId: 1, productName: "Laptop", unitPrice: 10000000, quantity: 2, availableStock: 10, subtotal: 20000000, status: "VALID" as const },
          { productId: 999, productName: "Invalid", unitPrice: 1000, quantity: 1, availableStock: 0, subtotal: 1000, status: "INVALID" as const, reason: "OUT_OF_STOCK" as const },
        ],
      }

      const mockOrder = {
        id: 13,
        userId: 1,
        status: "DRAFT",
        totalQuantity: 2,
        totalItemCount: 1,
        subtotal: 20000000,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          { id: 1, productId: 1, productName: "Laptop", unitPrice: 10000000, quantity: 2, subtotal: 20000000, orderId: 13, createdAt: new Date() },
        ],
      }

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any)

      // Act
      const result = await OrderService.createDraft({ checkoutPreview: mixedPreview })

      // Assert
      expect(result.items).toHaveLength(1)
      expect(result.items[0].productName).toBe("Laptop")
    })
  })
})
