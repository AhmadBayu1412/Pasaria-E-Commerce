// ============================================================
// CART RULES (Business Invariants)
// Phase 4 Step 2: Minimal - only business validation
//
// IMPORTANT: No data access here. Only validation.
// Data access lives in CartService.
//
// NOTE: DUPLICATE_PRODUCT error was removed because the behavior
// of Add To Cart is to INCREMENT quantity when product exists,
// not to reject with an error. The unique constraint in database
// ensures data integrity at the schema level.
// ============================================================

import { prisma } from "../../../infra/db/prisma.js"
import { BusinessError } from "../../../shared/errors/business.error.js"
import { BUSINESS_LIMITS } from "../../../shared/config/business.config.js"

// ============================================================
// AGGREGATE INVARIANTS
// These rules enforce the Cart aggregate invariants:
// I1: CartItem.quantity >= 1
// I2: CartItem.Product EXISTS
// I3: Cart.User IS UNIQUE
// I4: CartItem.Product IS UNIQUE per Cart (enforced by DB constraint)
// I5: CartItem.quantity <= BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY
// ============================================================

export const CartRules = {

  // --------------- Product Existence (I2) ---------------

  /**
   * Invariant I2: Product must exist
   *
   * @throws BusinessError with code "PRODUCT_NOT_FOUND" if product doesn't exist
   */
  async assertProductExists(productId: number): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })
    if (!product) {
      throw new BusinessError("Product not found", 404, "PRODUCT_NOT_FOUND")
    }
  },

  // --------------- Quantity Validation (I1 + I5) ---------------

  /**
   * Invariant I1 + I5: Quantity must be within limits (1 to MAX_CART_ITEM_QUANTITY)
   *
   * @throws BusinessError with code "INVALID_QUANTITY" if < 1
   * @throws BusinessError with code "QUANTITY_EXCEEDS_LIMIT" if > MAX
   */
  assertQuantityWithinLimit(quantity: number): void {
    if (quantity < 1) {
      throw new BusinessError(
        "Quantity must be at least 1",
        400,
        "INVALID_QUANTITY"
      )
    }
    if (quantity > BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY) {
      throw new BusinessError(
        `Quantity cannot exceed ${BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY}`,
        400,
        "QUANTITY_EXCEEDS_LIMIT"
      )
    }
  },

  /**
   * Validate total quantity after increment
   *
   * @param currentQuantity - Current quantity in cart
   * @param addQuantity - Quantity to add
   * @throws BusinessError if total exceeds limit
   */
  assertTotalQuantityWithinLimit(currentQuantity: number, addQuantity: number): void {
    const newQuantity = currentQuantity + addQuantity
    this.assertQuantityWithinLimit(newQuantity)
  },

  // --------------- Cart Ownership (I3) ---------------

  /**
   * Invariant I3: User must own Cart
   *
   * @throws BusinessError with code "CART_NOT_FOUND" if user doesn't own cart
   */
  async assertUserOwnsCart(userId: number, cartId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } })
    if (!cart || cart.userId !== userId) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }
  },

  // --------------- Cart Existence (I3) ---------------

  /**
   * Invariant I3: Cart must exist
   *
   * @throws BusinessError with code "CART_NOT_FOUND" if cart doesn't exist
   */
  async assertCartExists(cartId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } })
    if (!cart) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }
  },

  // --------------- CartItem Existence (I2) ---------------

  /**
   * Invariant I2: CartItem must exist
   *
   * @throws BusinessError with code "CART_ITEM_NOT_FOUND" if item doesn't exist
   */
  async assertCartItemExists(cartItemId: number): Promise<void> {
    const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } })
    if (!item) {
      throw new BusinessError("Cart item not found", 404, "CART_ITEM_NOT_FOUND")
    }
  },
}
