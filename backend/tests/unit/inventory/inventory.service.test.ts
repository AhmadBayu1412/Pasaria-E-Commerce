// ============================================================
// INVENTORY SERVICE UNIT TESTS
// Phase 4 Step 4: Inventory Foundation
//
// Philosophy: throw on failure, consistent with Cart pattern
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest"
import { BusinessError } from "../../../shared/errors/business.error.js"

vi.mock("../../../infra/db/prisma.js", () => {
  return {
    prisma: {
      product: {
        findUnique: vi.fn(),
      },
    },
  }
})

import { prisma } from "../../../infra/db/prisma.js"
import { InventoryService } from "../../../modules/inventory/inventory.service.js"

describe("InventoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("validateStock", () => {

    describe("Valid Scenarios", () => {

      it("should pass when product exists and stock sufficient", async () => {
        const mockProduct = { id: 1, availableStock: 10 }
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValue(mockProduct)

        const result = await InventoryService.validateStock({
          productId: 1,
          quantity: 5,
        })

        expect(result.productId).toBe(1)
        expect(result.availableStock).toBe(10)
      })

      it("should pass for exact stock match", async () => {
        const mockProduct = { id: 1, availableStock: 5 }
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValue(mockProduct)

        const result = await InventoryService.validateStock({
          productId: 1,
          quantity: 5,
        })

        expect(result.availableStock).toBe(5)
      })

      it("should return product data for caller use", async () => {
        const mockProduct = { id: 5, availableStock: 15 }
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValue(mockProduct)

        const result = await InventoryService.validateStock({
          productId: 5,
          quantity: 3,
        })

        // Caller (Checkout) can use this data without querying again
        expect(result.productId).toBe(5)
        expect(result.availableStock).toBe(15)
      })
    })

    describe("Error Scenarios", () => {

      it("should throw PRODUCT_NOT_FOUND when product does not exist", async () => {
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValue(null)

        await expect(
          InventoryService.validateStock({ productId: 999, quantity: 5 })
        ).rejects.toMatchObject({
          code: "PRODUCT_NOT_FOUND",
          statusCode: 404,
        })
      })

      it("should throw INSUFFICIENT_STOCK when stock < quantity", async () => {
        const mockProduct = { id: 1, availableStock: 5 }
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValue(mockProduct)

        await expect(
          InventoryService.validateStock({ productId: 1, quantity: 10 })
        ).rejects.toMatchObject({
          code: "INSUFFICIENT_STOCK",
          statusCode: 400,
        })
      })

      it("should throw QUANTITY_EXCEEDS_LIMIT when quantity > 99", async () => {
        const mockProduct = { id: 1, availableStock: 100 }
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValue(mockProduct)

        await expect(
          InventoryService.validateStock({ productId: 1, quantity: 100 })
        ).rejects.toMatchObject({
          code: "QUANTITY_EXCEEDS_LIMIT",
          statusCode: 400,
        })
      })

      it("should throw INVALID_QUANTITY when quantity = 0", async () => {
        const mockProduct = { id: 1, availableStock: 10 }
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValue(mockProduct)

        await expect(
          InventoryService.validateStock({ productId: 1, quantity: 0 })
        ).rejects.toMatchObject({
          code: "INVALID_QUANTITY",
          statusCode: 400,
        })
      })

      it("should throw with clear error message for insufficient stock", async () => {
        const mockProduct = { id: 1, availableStock: 3 }
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValue(mockProduct)

        try {
          await InventoryService.validateStock({ productId: 1, quantity: 10 })
        } catch (e) {
          const err = e as BusinessError
          expect(err.message).toContain("Available: 3")
          expect(err.message).toContain("Requested: 10")
        }
      })
    })

    describe("Integration with Rules", () => {

      it("should validate quantity before checking stock", async () => {
        const mockProduct = { id: 1, availableStock: 10 }
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValue(mockProduct)

        // quantity = 0 should throw INVALID_QUANTITY (not INSUFFICIENT_STOCK)
        await expect(
          InventoryService.validateStock({ productId: 1, quantity: 0 })
        ).rejects.toMatchObject({
          code: "INVALID_QUANTITY",
        })
      })
    })
  })
})
