// ============================================================
// CART RULES (Business Invariants)
// Step 1: Existence checks only
// Availability checks: Step 4 (Inventory Reservation)
// ============================================================

import { prisma } from "../../../infra/db/prisma.js"
import { BusinessError } from "../../../shared/errors/business.error.js"

// ============================================================
// AGGREGATE INVARIANTS
// These rules enforce the Cart aggregate invariants:
// I1: CartItem.quantity >= 1
// I2: CartItem.Product EXISTS
// I3: Cart.User IS UNIQUE
// I4: CartItem.Product IS UNIQUE per Cart
// I5: CartItem.quantity <= BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY
// ============================================================

export const CartRules = {
  // --------------- Cart Existence ---------------

  /**
   * Invariant I3: Cart harus ada
   */
  async assertCartExists(cartId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } })
    if (!cart) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }
  },

  /**
   * Invariant I3: User harus punya Cart
   * Returns the cart if exists, null otherwise
   */
  async getCartByUserId(userId: number) {
    return prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    })
  },

  /**
   * Get cart or throw error
   */
  async assertCartExistsByUserId(userId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }
  },

  // --------------- CartItem Existence ---------------

  /**
   * Invariant I2: CartItem harus ada
   */
  async assertCartItemExists(cartItemId: number): Promise<void> {
    const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } })
    if (!item) {
      throw new BusinessError("Cart item not found", 404, "CART_ITEM_NOT_FOUND")
    }
  },

  /**
   * Get CartItem by cart and product
   */
  async getCartItemByProductId(cartId: number, productId: number) {
    return prisma.cartItem.findFirst({
      where: { cartId, productId },
    })
  },

  // --------------- Product Existence ---------------

  /**
   * Invariant I2: Product harus ada
   * NOTE: Hanya existence check. Inventory/stock availability
   *       check ada di Step 4 (Inventory Reservation).
   */
  async assertProductExists(productId: number): Promise<void> {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      throw new BusinessError("Product not found", 404, "PRODUCT_NOT_FOUND")
    }
  },

  // --------------- Ownership ---------------

  /**
   * Invariant I3: User harus own Cart
   * NOTE: Called after auth middleware validates user session.
   *       This rule is for additional domain-level validation.
   */
  async assertUserOwnsCart(userId: number, cartId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } })
    if (!cart || cart.userId !== userId) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }
  },

  // --------------- Uniqueness ---------------

  /**
   * Invariant I4: Product tidak boleh duplicate dalam Cart
   * Called before adding new item to check if product already exists
   */
  async assertProductNotInCart(cartId: number, productId: number): Promise<void> {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId, productId },
    })
    if (existing) {
      throw new BusinessError(
        "Product already in cart. Use update quantity instead.",
        409,
        "DUPLICATE_PRODUCT"
      )
    }
  },

  /**
   * Check if product exists in cart
   * Returns true if exists, false otherwise
   */
  async isProductInCart(cartId: number, productId: number): Promise<boolean> {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId, productId },
    })
    return existing !== null
  },

  // --------------- Quantity Validation ---------------

  /**
   * Invariant I1 + I5: Quantity harus valid
   * Used for both add and update operations
   */
  assertQuantityValid(quantity: number): void {
    if (quantity < 1) {
      throw new BusinessError(
        "Quantity must be at least 1",
        400,
        "INVALID_QUANTITY"
      )
    }
    if (quantity > 99) {
      throw new BusinessError(
        "Quantity cannot exceed 99",
        400,
        "QUANTITY_EXCEEDS_LIMIT"
      )
    }
  },
}
