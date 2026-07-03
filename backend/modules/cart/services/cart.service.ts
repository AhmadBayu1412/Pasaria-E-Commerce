// ============================================================
// CART SERVICE - Domain Behavior Implementation
// Phase 4 Step 2: Add To Cart
//
// Responsible for:
// - Lazy Cart creation
// - Add item to Cart (create or increment)
// - All CartItem modifications through this service
//
// NOT responsible for:
// - Inventory management (Step 4)
// - Checkout (Step 5+)
// - Pricing (Step 5+)
// - Remove/Update operations (Step 3)
// ============================================================

import { prisma } from "../../../infra/db/prisma.js"
import { CartRules } from "../rules/cart.rules.js"
import type { AddToCartServiceInput, AddToCartResult, CartWithItems } from "../types/cart.types.js"

// ----- Service Implementation -----

export const CartService = {
  /**
   * Add Product To Cart
   *
   * Algorithm:
   * 1. Assert product exists (Business Rule)
   * 2. Get or create Cart lazily (Data Access)
   * 3. Check if product already in cart (Data Access)
   * 4. If exists: increment quantity
   * 5. If not exists: create CartItem
   * 6. Return updated cart with computed fields
   *
   * Uses Prisma transaction for consistency.
   */
  async addToCart(input: AddToCartServiceInput): Promise<AddToCartResult> {
    const { userId, productId, quantity = 1 } = input

    // Step 1: Business validation - Product must exist
    await CartRules.assertProductExists(productId)

    // Step 2: Execute in transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // 2a: Get or create Cart (Lazy creation)
      let cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      })

      if (!cart) {
        cart = await tx.cart.create({
          data: { userId },
          include: { items: true },
        })
      }

      // 2b: Check if product already in cart
      const existingItem = await tx.cartItem.findFirst({
        where: { cartId: cart.id, productId },
      })

      let action: "CREATED" | "INCREMENTED"

      if (existingItem) {
        // 2c: Increment quantity
        const newQuantity = existingItem.quantity + quantity

        // Business validation - total quantity must be within limit
        CartRules.assertTotalQuantityWithinLimit(existingItem.quantity, quantity)

        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        })

        action = "INCREMENTED"
      } else {
        // 2d: Create new CartItem
        CartRules.assertQuantityWithinLimit(quantity)

        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        })

        action = "CREATED"
      }

      // Step 3: Fetch updated cart with all items
      const updatedCart = await tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      return {
        cart: updatedCart as CartWithItems,
        action,
      }
    })

    // Step 4: Build response
    return buildCartResponse(result.cart, result.action)
  },

  /**
   * Get Cart by User ID
   * Returns null if cart doesn't exist (lazy - cart not created yet)
   *
   * NOTE: This is Step 3 territory. Included here for convenience
   * of internal use (e.g., for testing or other services).
   */
  async getCartByUserId(userId: number): Promise<CartWithItems | null> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    })
    return cart as CartWithItems | null
  },
} as const

// ----- Helper Functions -----

function buildCartResponse(cart: CartWithItems, action: "CREATED" | "INCREMENTED"): AddToCartResult {
  return {
    cart,
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    _meta: {
      action,  // Internal use only - for logging/debugging
    },
  }
}
