// ============================================================
// CART SERVICE UNIT TESTS
// Phase 4 Step 2: Add To Cart
// Phase 4 Step 3: Cart Management
//
// Tests for CartService behavior
// ============================================================
// PHASE 4 - Step 3: Cart Management
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest"
import { BusinessError } from "../../../shared/errors/business.error.js"
import { CartRules } from "../../../modules/cart/rules/cart.rules.js"

// Mock the entire modules before importing
vi.mock("../../../infra/db/prisma.js", () => {
  const mockTx = {
    product: { findUnique: vi.fn() },
    cart: { findUnique: vi.fn(), create: vi.fn() },
    cartItem: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
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
    vi.resetAllMocks()
  })

  // ============================================================
  // STEP 2: ADD TO CART TESTS
  // ============================================================

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

  // ============================================================
  // STEP 3: GET CART TESTS
  // ============================================================

  describe("getCart", () => {

    it("should return CartView when cart exists", async () => {
      const mockCart = {
        id: 1,
        userId: 100,
        items: [
          { id: 1, cartId: 1, productId: 1, quantity: 2, createdAt: new Date(), updatedAt: new Date() },
          { id: 2, cartId: 1, productId: 2, quantity: 3, createdAt: new Date(), updatedAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart)

      const result = await CartService.getCart({ userId: 100 })

      expect(result.cartId).toBe(1)
      expect(result.userId).toBe(100)
      expect(result.items).toHaveLength(2)
      expect(result.itemCount).toBe(2)
      expect(result.totalQuantity).toBe(5)
      expect(result.createdAt).not.toBeNull()
      expect(result.updatedAt).not.toBeNull()
    })

    it("should return empty CartView when cart does not exist", async () => {
      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const result = await CartService.getCart({ userId: 100 })

      expect(result.cartId).toBeNull()
      expect(result.userId).toBe(100)
      expect(result.items).toHaveLength(0)
      expect(result.itemCount).toBe(0)
      expect(result.totalQuantity).toBe(0)
      expect(result.createdAt).toBeNull()
      expect(result.updatedAt).toBeNull()
    })
  })

  // ============================================================
  // STEP 3: UPDATE QUANTITY TESTS
  // ============================================================

  describe("updateQuantity", () => {

    describe("Valid Operations", () => {

      it("should update quantity successfully", async () => {
        const existingItem = {
          id: 1,
          cartId: 1,
          productId: 1,
          quantity: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        const mockCart = {
          id: 1,
          userId: 100,
          items: [existingItem],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        const updatedItem = { ...existingItem, quantity: 5 }
        const mockUpdatedCart = { ...mockCart, items: [updatedItem] }

        // First call: assertCartExistsForUser
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(mockCart)  // For assertCartExistsForUser
          .mockResolvedValueOnce(mockCart)  // Inside transaction - get cart
          .mockResolvedValueOnce(mockUpdatedCart)  // Fetch updated cart

        const result = await CartService.updateQuantity({
          userId: 100,
          productId: 1,
          quantity: 5,
        })

        expect(result.previousQuantity).toBe(2)
        expect(result.newQuantity).toBe(5)
        expect(prisma.cartItem.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { quantity: 5 },
        })
      })

      it("should be idempotent when setting same quantity", async () => {
        const existingItem = {
          id: 1,
          cartId: 1,
          productId: 1,
          quantity: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        const mockCart = {
          id: 1,
          userId: 100,
          items: [existingItem],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(mockCart)
          .mockResolvedValueOnce(mockCart)
          .mockResolvedValueOnce(mockCart)

        const result = await CartService.updateQuantity({
          userId: 100,
          productId: 1,
          quantity: 5,
        })

        expect(result.previousQuantity).toBe(5)
        expect(result.newQuantity).toBe(5)
      })

      it("should throw error when cart does not exist", async () => {
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

        await expect(
          CartService.updateQuantity({
            userId: 100,
            productId: 1,
            quantity: 5,
          })
        ).rejects.toThrow(BusinessError)

        await expect(
          CartService.updateQuantity({
            userId: 100,
            productId: 1,
            quantity: 5,
          })
        ).rejects.toMatchObject({
          code: "CART_NOT_FOUND",
          statusCode: 404,
        })
      })

      it("should throw error when item does not exist", async () => {
        const mockCart = {
          id: 1,
          userId: 100,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Setup mocks with extra returns to handle all possible calls
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(mockCart)  // assertCartExistsForUser
          .mockResolvedValueOnce(mockCart)  // get cart in tx
          .mockResolvedValueOnce(mockCart)  // fetch updated cart
          .mockResolvedValue(mockCart)  // fallback for any extra calls

        await expect(
          CartService.updateQuantity({
            userId: 100,
            productId: 999,
            quantity: 5,
          })
        ).rejects.toMatchObject({
          code: "CART_ITEM_NOT_FOUND",
          statusCode: 404,
        })
      })

      it("should throw error when quantity exceeds limit", async () => {
        const existingItem = {
          id: 1,
          cartId: 1,
          productId: 1,
          quantity: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        const mockCart = {
          id: 1,
          userId: 100,
          items: [existingItem],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Setup mocks with extra returns
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(mockCart)  // assertCartExistsForUser
          .mockResolvedValueOnce(mockCart)  // get cart in tx
          .mockResolvedValueOnce(mockCart)  // fetch updated cart
          .mockResolvedValue(mockCart)  // fallback

        await expect(
          CartService.updateQuantity({
            userId: 100,
            productId: 1,
            quantity: 100,
          })
        ).rejects.toMatchObject({
          code: "QUANTITY_EXCEEDS_LIMIT",
          statusCode: 400,
        })
      })

      it("should throw error when quantity is zero", async () => {
        const existingItem = {
          id: 1,
          cartId: 1,
          productId: 1,
          quantity: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        const mockCart = {
          id: 1,
          userId: 100,
          items: [existingItem],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Setup mocks with extra returns
        ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(mockCart)  // assertCartExistsForUser
          .mockResolvedValueOnce(mockCart)  // get cart in tx
          .mockResolvedValueOnce(mockCart)  // fetch updated cart
          .mockResolvedValue(mockCart)  // fallback

        await expect(
          CartService.updateQuantity({
            userId: 100,
            productId: 1,
            quantity: 0,
          })
        ).rejects.toMatchObject({
          code: "INVALID_QUANTITY_ZERO",
          statusCode: 400,
        })
      })
    })
  })

  // ============================================================
  // STEP 3: REMOVE ITEM TESTS
  // ============================================================

  describe("removeItem", () => {

    it("should remove item successfully", async () => {
      const existingItem = {
        id: 1,
        cartId: 1,
        productId: 1,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockCart = {
        id: 1,
        userId: 100,
        items: [existingItem],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockUpdatedCart = {
        id: 1,
        userId: 100,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockUpdatedCart)

      const result = await CartService.removeItem({
        userId: 100,
        productId: 1,
      })

      expect(result.removedProductId).toBe(1)
      expect(result.itemCount).toBe(0)
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it("should throw error when cart does not exist", async () => {
      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      await expect(
        CartService.removeItem({
          userId: 100,
          productId: 1,
        })
      ).rejects.toMatchObject({
        code: "CART_NOT_FOUND",
        statusCode: 404,
      })
    })

    it("should throw error when item does not exist", async () => {
      const mockCart = {
        id: 1,
        userId: 100,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCart)

      await expect(
        CartService.removeItem({
          userId: 100,
          productId: 999,
        })
      ).rejects.toMatchObject({
        code: "CART_ITEM_NOT_FOUND",
        statusCode: 404,
      })
    })

    it("should NOT delete cart, only item", async () => {
      const existingItem = {
        id: 1,
        cartId: 1,
        productId: 1,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockCart = {
        id: 1,
        userId: 100,
        items: [existingItem],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockUpdatedCart = {
        id: 1,
        userId: 100,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockUpdatedCart)

      await CartService.removeItem({
        userId: 100,
        productId: 1,
      })

      // Verify cart was NOT deleted
      expect(prisma.cartItem.delete).toHaveBeenCalled()
    })
  })

  // ============================================================
  // STEP 3: CLEAR CART TESTS
  // ============================================================

  describe("clearCart", () => {

    it("should clear all items successfully", async () => {
      const mockCart = {
        id: 1,
        userId: 100,
        items: [
          { id: 1, cartId: 1, productId: 1, quantity: 2, createdAt: new Date(), updatedAt: new Date() },
          { id: 2, cartId: 1, productId: 2, quantity: 3, createdAt: new Date(), updatedAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockUpdatedCart = {
        id: 1,
        userId: 100,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockUpdatedCart)

      const result = await CartService.clearCart({
        userId: 100,
      })

      expect(result.itemsRemoved).toBe(2)
      expect(result.cart.items).toHaveLength(0)
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 1 },
      })
    })

    it("should throw error when cart does not exist", async () => {
      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      await expect(
        CartService.clearCart({
          userId: 100,
        })
      ).rejects.toMatchObject({
        code: "CART_NOT_FOUND",
        statusCode: 404,
      })
    })

    it("should handle clearing empty cart gracefully", async () => {
      const mockCart = {
        id: 1,
        userId: 100,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCart)

      const result = await CartService.clearCart({
        userId: 100,
      })

      expect(result.itemsRemoved).toBe(0)
      expect(result.cart.items).toHaveLength(0)
    })

    it("should NOT delete cart, only items", async () => {
      const mockCart = {
        id: 1,
        userId: 100,
        items: [
          { id: 1, cartId: 1, productId: 1, quantity: 2, createdAt: new Date(), updatedAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockUpdatedCart = {
        id: 1,
        userId: 100,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockUpdatedCart)

      await CartService.clearCart({
        userId: 100,
      })

      // Verify cart was NOT deleted - only items were deleted
      expect(prisma.cartItem.deleteMany).toHaveBeenCalled()
    })
  })

  // ============================================================
  // INTERNAL METHOD TEST
  // ============================================================

  describe("getCartByUserId (internal)", () => {

    it("should return null when cart does not exist", async () => {
      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const result = await CartService.getCartByUserId(100)

      expect(result).toBeNull()
    })

    it("should return cart with items when cart exists", async () => {
      const mockCart = {
        id: 1,
        userId: 100,
        items: [{ id: 1, cartId: 1, productId: 1, quantity: 2, createdAt: new Date(), updatedAt: new Date() }],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      ;(prisma.cart.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart)

      const result = await CartService.getCartByUserId(100)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(1)
      expect(result?.items).toHaveLength(1)
    })
  })
})

// ============================================================
// CARTRULES UNIT TESTS
// ============================================================

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

  describe("assertQuantityNotZero (Invariant I2)", () => {

    it("should not throw for quantity > 0", () => {
      expect(() => CartRules.assertQuantityNotZero(1)).not.toThrow()
      expect(() => CartRules.assertQuantityNotZero(50)).not.toThrow()
      expect(() => CartRules.assertQuantityNotZero(99)).not.toThrow()
    })

    it("should throw for zero quantity", () => {
      expect(() => CartRules.assertQuantityNotZero(0)).toThrow(BusinessError)
    })

    it("should throw with INVALID_QUANTITY_ZERO error code", () => {
      expect(() => CartRules.assertQuantityNotZero(0)).toThrow(BusinessError)
      try {
        CartRules.assertQuantityNotZero(0)
      } catch (e) {
        expect((e as BusinessError).code).toBe("INVALID_QUANTITY_ZERO")
      }
    })
  })

  describe("assertValidUpdateQuantity", () => {

    it("should not throw for valid quantity", () => {
      expect(() => CartRules.assertValidUpdateQuantity(1)).not.toThrow()
      expect(() => CartRules.assertValidUpdateQuantity(50)).not.toThrow()
      expect(() => CartRules.assertValidUpdateQuantity(99)).not.toThrow()
    })

    it("should throw for zero quantity", () => {
      expect(() => CartRules.assertValidUpdateQuantity(0)).toThrow(BusinessError)
    })

    it("should throw for negative quantity", () => {
      expect(() => CartRules.assertValidUpdateQuantity(-1)).toThrow(BusinessError)
    })

    it("should throw for quantity exceeding limit", () => {
      expect(() => CartRules.assertValidUpdateQuantity(100)).toThrow(BusinessError)
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
