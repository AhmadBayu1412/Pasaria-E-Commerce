// ============================================================
// CART SERVICE UNIT TESTS
// Phase 4 Step 2: Add To Cart
//
// Tests for CartService.addToCart behavior
// Note: These tests use simplified mocks for unit testing
// Integration tests use real database
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest"
import { BusinessError } from "../../../shared/errors/business.error.js"
import { CartRules } from "../../../modules/cart/rules/cart.rules.js"

// Mock the entire modules before importing
vi.mock("../../../infra/db/prisma.js", () => {
  const mockTx = {
    product: { findUnique: vi.fn() },
    cart: { findUnique: vi.fn(), create: vi.fn() },
    cartItem: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  }

  return {
    prisma: {
      ...mockTx,
      $transaction: vi.fn((callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      }),
    },
  }
})

// Import after mocking
import { prisma } from "../../../infra/db/prisma.js"
import { CartService } from "../../../modules/cart/services/cart.service.js"

describe("CartService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("addToCart", () => {

    describe("Valid Operations", () => {

      it("should create cart and item when cart doesn't exist", async () => {
        const mockProduct = { id: 1, name: "Test Product" }
        const mockCart = { id: 1, userId: 100, items: [] }
        const mockCreatedItem = { id: 1, cartId: 1, productId: 1, quantity: 1 }
        const mockUpdatedCart = { id: 1, userId: 100, items: [mockCreatedItem] }

        // Setup mock chain
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct)

        // Inside transaction
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(null)  // First call - cart doesn't exist
          .mockResolvedValueOnce(mockUpdatedCart)  // After item created - fetch updated cart

        ;(prisma.cart.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart)
        ;(prisma.cartItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
        ;(prisma.cartItem.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedItem)

        // Execute
        const result = await CartService.addToCart({
          userId: 100,
          productId: 1,
          quantity: 1,
        })

        // Assert
        expect(result._meta.action).toBe("CREATED")
        expect(result.itemCount).toBe(1)
        expect(result.totalQuantity).toBe(1)
        expect(prisma.cart.create).toHaveBeenCalled()
      })

      it("should increment quantity when product already in cart", async () => {
        const mockProduct = { id: 1, name: "Test Product" }
        const existingItem = { id: 1, cartId: 1, productId: 1, quantity: 2 }
        const mockCart = { id: 1, userId: 100, items: [existingItem] }
        const updatedItem = { ...existingItem, quantity: 3 }
        const mockUpdatedCart = { ...mockCart, items: [updatedItem] }

        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct)
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(mockCart)
          .mockResolvedValueOnce(mockUpdatedCart)
        ;(prisma.cartItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(existingItem)
        ;(prisma.cartItem.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedItem)

        // Execute
        const result = await CartService.addToCart({
          userId: 100,
          productId: 1,
          quantity: 1,
        })

        // Assert
        expect(result._meta.action).toBe("INCREMENTED")
        expect(prisma.cartItem.update).toHaveBeenCalledWith({
          where: { id: existingItem.id },
          data: { quantity: 3 },
        })
      })

      it("should use default quantity of 1 when not provided", async () => {
        const mockProduct = { id: 1, name: "Test Product" }
        const mockCart = { id: 1, userId: 100, items: [] }
        const mockCreatedItem = { id: 1, cartId: 1, productId: 1, quantity: 1 }
        const mockUpdatedCart = { ...mockCart, items: [mockCreatedItem] }

        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct)
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(mockCart)
          .mockResolvedValueOnce(mockUpdatedCart)
        ;(prisma.cartItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
        ;(prisma.cartItem.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedItem)

        // Execute without quantity
        const result = await CartService.addToCart({
          userId: 100,
          productId: 1,
        })

        // Assert
        expect(result._meta.action).toBe("CREATED")
        expect(result.totalQuantity).toBe(1)
      })

      it("should compute correct itemCount and totalQuantity", async () => {
        const mockProduct = { id: 1, name: "Test Product" }
        const mockCart = {
          id: 1,
          userId: 100,
          items: [
            { id: 1, cartId: 1, productId: 2, quantity: 3 },
            { id: 2, cartId: 1, productId: 3, quantity: 2 },
          ],
        }
        const mockCreatedItem = { id: 3, cartId: 1, productId: 1, quantity: 5 }
        const mockUpdatedCart = {
          ...mockCart,
          items: [...mockCart.items, mockCreatedItem],
        }

        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct)
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(mockCart)
          .mockResolvedValueOnce(mockUpdatedCart)
        ;(prisma.cartItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
        ;(prisma.cartItem.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedItem)

        // Execute
        const result = await CartService.addToCart({
          userId: 100,
          productId: 1,
          quantity: 5,
        })

        // Assert
        expect(result.itemCount).toBe(3) // 3 jenis produk
        expect(result.totalQuantity).toBe(10) // 3 + 2 + 5
      })
    })

    describe("Error Cases", () => {

      it("should throw error when product does not exist", async () => {
        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

        await expect(
          CartService.addToCart({
            userId: 100,
            productId: 999,
            quantity: 1,
          })
        ).rejects.toThrow(BusinessError)

        await expect(
          CartService.addToCart({
            userId: 100,
            productId: 999,
            quantity: 1,
          })
        ).rejects.toMatchObject({
          code: "PRODUCT_NOT_FOUND",
          statusCode: 404,
        })
      })

      it("should throw error when quantity would exceed limit", async () => {
        const mockProduct = { id: 1, name: "Test Product" }
        const existingItem = { id: 1, cartId: 1, productId: 1, quantity: 95 }
        const mockCart = { id: 1, userId: 100, items: [existingItem] }

        ;(prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct)
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart)
        ;(prisma.cartItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(existingItem)

        // Execute & Assert - adding 10 would make 105 > 99
        await expect(
          CartService.addToCart({
            userId: 100,
            productId: 1,
            quantity: 10,
          })
        ).rejects.toThrow(BusinessError)

        await expect(
          CartService.addToCart({
            userId: 100,
            productId: 1,
            quantity: 10,
          })
        ).rejects.toMatchObject({
          code: "QUANTITY_EXCEEDS_LIMIT",
          statusCode: 400,
        })
      })
    })
  })

  describe("getCartByUserId", () => {

    it("should return null when cart does not exist", async () => {
      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const result = await CartService.getCartByUserId(100)

      expect(result).toBeNull()
    })

    it("should return cart with items when cart exists", async () => {
      const mockCart = {
        id: 1,
        userId: 100,
        items: [{ id: 1, cartId: 1, productId: 1, quantity: 2 }],
      }
      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart)

      const result = await CartService.getCartByUserId(100)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(1)
      expect(result?.items).toHaveLength(1)
    })
  })
})

describe("CartRules - Quantity Validation", () => {

  describe("assertQuantityWithinLimit", () => {

    it("should not throw for valid quantity (1)", () => {
      expect(() => CartRules.assertQuantityWithinLimit(1)).not.toThrow()
    })

    it("should not throw for valid quantity (99)", () => {
      expect(() => CartRules.assertQuantityWithinLimit(99)).not.toThrow()
    })

    it("should throw for zero quantity", () => {
      expect(() => CartRules.assertQuantityWithinLimit(0)).toThrow(BusinessError)
    })

    it("should throw for negative quantity", () => {
      expect(() => CartRules.assertQuantityWithinLimit(-1)).toThrow(BusinessError)
    })

    it("should throw for quantity exceeding 99", () => {
      expect(() => CartRules.assertQuantityWithinLimit(100)).toThrow(BusinessError)
    })
  })

  describe("assertTotalQuantityWithinLimit", () => {

    it("should not throw when total is within limit", () => {
      expect(() => CartRules.assertTotalQuantityWithinLimit(50, 30)).not.toThrow()
    })

    it("should throw when total exceeds limit", () => {
      expect(() => CartRules.assertTotalQuantityWithinLimit(90, 20)).toThrow(BusinessError)
    })

    it("should throw when current already at max", () => {
      expect(() => CartRules.assertTotalQuantityWithinLimit(99, 1)).toThrow(BusinessError)
    })
  })
})
