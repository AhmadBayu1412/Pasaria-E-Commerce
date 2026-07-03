// ============================================================
// CART VALIDATION UNIT TESTS
// Phase 4 Step 1
// ============================================================

import { describe, it, expect } from "vitest"
import {
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema,
} from "../../../modules/cart/validation/cart.validation.js"
import { BUSINESS_LIMITS } from "../../../shared/config/business.config.js"

describe("Cart Validation", () => {

  // ============================================================
  // addToCartSchema Tests
  // ============================================================
  describe("addToCartSchema", () => {

    describe("Valid Inputs", () => {
      it("should accept valid productId with quantity", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: 5,
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.productId).toBe(1)
          expect(result.data.quantity).toBe(5)
        }
      })

      it("should accept valid productId without quantity (default to 1)", () => {
        const result = addToCartSchema.safeParse({
          productId: 42,
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.productId).toBe(42)
          expect(result.data.quantity).toBe(1)
        }
      })

      it("should accept minimum quantity (1)", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: 1,
        })
        expect(result.success).toBe(true)
      })

      it("should accept maximum quantity (99)", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: 99,
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.quantity).toBe(99)
        }
      })

      it("should accept quantity equal to BUSINESS_LIMITS.MAX", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY,
        })
        expect(result.success).toBe(true)
      })
    })

    describe("Invalid ProductId", () => {
      it("should reject missing productId", () => {
        const result = addToCartSchema.safeParse({})
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("productId")
        }
      })

      it("should reject string productId", () => {
        const result = addToCartSchema.safeParse({
          productId: "1",
        } as unknown as { productId: number })
        expect(result.success).toBe(false)
      })

      it("should reject negative productId", () => {
        const result = addToCartSchema.safeParse({
          productId: -1,
          quantity: 1,
        })
        expect(result.success).toBe(false)
      })

      it("should reject zero productId", () => {
        const result = addToCartSchema.safeParse({
          productId: 0,
          quantity: 1,
        })
        expect(result.success).toBe(false)
      })

      it("should reject decimal productId", () => {
        const result = addToCartSchema.safeParse({
          productId: 1.5,
          quantity: 1,
        })
        expect(result.success).toBe(false)
      })
    })

    describe("Invalid Quantity", () => {
      it("should reject zero quantity", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: 0,
        })
        expect(result.success).toBe(false)
      })

      it("should reject negative quantity", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: -5,
        })
        expect(result.success).toBe(false)
      })

      it("should reject quantity exceeding MAX_CART_ITEM_QUANTITY", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: 100,
        })
        expect(result.success).toBe(false)
      })

      it("should reject quantity exceeding limit by 1", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY + 1,
        })
        expect(result.success).toBe(false)
      })

      it("should reject decimal quantity", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: 2.5,
        })
        expect(result.success).toBe(false)
      })

      it("should reject string quantity", () => {
        const result = addToCartSchema.safeParse({
          productId: 1,
          quantity: "5",
        } as unknown as { productId: number; quantity: number })
        expect(result.success).toBe(false)
      })
    })
  })

  // ============================================================
  // updateCartItemSchema Tests
  // ============================================================
  describe("updateCartItemSchema", () => {

    describe("Valid Inputs", () => {
      it("should accept valid quantity", () => {
        const result = updateCartItemSchema.safeParse({ quantity: 10 })
        expect(result.success).toBe(true)
      })

      it("should accept minimum quantity (1)", () => {
        const result = updateCartItemSchema.safeParse({ quantity: 1 })
        expect(result.success).toBe(true)
      })

      it("should accept maximum quantity (99)", () => {
        const result = updateCartItemSchema.safeParse({ quantity: 99 })
        expect(result.success).toBe(true)
      })
    })

    describe("Invalid Inputs", () => {
      it("should reject missing quantity", () => {
        const result = updateCartItemSchema.safeParse({})
        expect(result.success).toBe(false)
      })

      it("should reject zero quantity", () => {
        const result = updateCartItemSchema.safeParse({ quantity: 0 })
        expect(result.success).toBe(false)
      })

      it("should reject negative quantity", () => {
        const result = updateCartItemSchema.safeParse({ quantity: -1 })
        expect(result.success).toBe(false)
      })

      it("should reject quantity exceeding limit", () => {
        const result = updateCartItemSchema.safeParse({ quantity: 100 })
        expect(result.success).toBe(false)
      })
    })
  })

  // ============================================================
  // removeFromCartSchema Tests
  // ============================================================
  describe("removeFromCartSchema", () => {

    describe("Valid Inputs", () => {
      it("should accept valid productId", () => {
        const result = removeFromCartSchema.safeParse({ productId: 1 })
        expect(result.success).toBe(true)
      })

      it("should accept large productId", () => {
        const result = removeFromCartSchema.safeParse({ productId: 999999 })
        expect(result.success).toBe(true)
      })
    })

    describe("Invalid Inputs", () => {
      it("should reject missing productId", () => {
        const result = removeFromCartSchema.safeParse({})
        expect(result.success).toBe(false)
      })

      it("should reject zero productId", () => {
        const result = removeFromCartSchema.safeParse({ productId: 0 })
        expect(result.success).toBe(false)
      })

      it("should reject negative productId", () => {
        const result = removeFromCartSchema.safeParse({ productId: -1 })
        expect(result.success).toBe(false)
      })
    })
  })
})
