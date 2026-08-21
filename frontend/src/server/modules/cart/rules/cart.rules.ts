// ============================================================
// CART RULES (Business Invariants)
// Phase 4 Step 2: Minimal - only business validation
// Phase 4 Step 3: Added assertQuantityNotZero (Invariant I2)
//
// IMPORTANT: No data access here. Only validation.
// Data access lives in CartService.
// ============================================================
// PHASE 4 - Step 3: Cart Management
// ============================================================

import { prisma } from "../../../infra/db/prisma"
import { BusinessError } from "../../../shared/errors/business.error"
import { BUSINESS_LIMITS } from "../../../shared/config/business.config"

// ============================================================
// AGGREGATE INVARIANTS (Complete - Step 3)
// These rules enforce the Cart aggregate invariants:
// I1: CartItem.quantity >= 1
// I2: CartItem.quantity NEVER = 0 (invariant hard)
//     → Jika quantity menjadi 0, item DIHAPUS, bukan disimpan
// I3: CartItem.quantity <= BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY
// I4: CartItem.Product EXISTS
// I5: Cart.User IS UNIQUE
// I6: CartItem.Product IS UNIQUE per Cart (enforced by DB constraint)
// I7: Empty Cart adalah valid business state (Cart tetap ada dengan items=[])
// ============================================================

export const CartRules = {

  // --------------- Product Existence (I4) ---------------

  /**
   * Invariant I4: Product must exist
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

  // --------------- Quantity Validation (I1 + I2 + I3) ---------------

  /**
   * Invariant I1 + I3: Quantity must be within limits (1 to MAX_CART_ITEM_QUANTITY)
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
   * Invariant I2: CartItem.quantity must NEVER be 0
   *
   * Jika quantity mencapai 0:
   * → Item HARUS dihapus dari database
   * → Item TIDAK BOLEH di-update menjadi 0
   *
   * Implementation:
   * - updateQuantity() harus throw jika quantity = 0
   * - removeItem() adalah cara yang benar untuk "set quantity = 0"
   *
   * @throws BusinessError with code "INVALID_QUANTITY_ZERO" if quantity = 0
   */
  assertQuantityNotZero(quantity: number): void {
    if (quantity === 0) {
      throw new BusinessError(
        "Quantity cannot be zero. Use removeItem instead.",
        400,
        "INVALID_QUANTITY_ZERO"
      )
    }
  },

  /**
   * Validate new quantity for update operation
   * Combines I1 + I2 + I3 checks
   *
   * @throws BusinessError if quantity is invalid
   */
  assertValidUpdateQuantity(quantity: number): void {
    this.assertQuantityNotZero(quantity)      // I2: must be > 0
    this.assertQuantityWithinLimit(quantity)   // I1 + I3: 1 to MAX
  },

  /**
   * Validate total quantity after increment (Add To Cart)
   *
   * @param currentQuantity - Current quantity in cart
   * @param addQuantity - Quantity to add
   * @throws BusinessError if total exceeds limit
   */
  assertTotalQuantityWithinLimit(currentQuantity: number, addQuantity: number): void {
    const newQuantity = currentQuantity + addQuantity
    this.assertQuantityWithinLimit(newQuantity)
  },

  // --------------- Cart Ownership (I5) ---------------

  /**
   * Invariant I5: User must own Cart
   *
   * @throws BusinessError with code "CART_NOT_FOUND" if user doesn't own cart
   */
  async assertUserOwnsCart(userId: number, cartId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } })
    if (!cart || cart.userId !== userId) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }
  },

  // --------------- Cart Existence (I5) ---------------

  /**
   * Invariant I5: Cart must exist
   *
   * @throws BusinessError with code "CART_NOT_FOUND" if cart doesn't exist
   */
  async assertCartExists(cartId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } })
    if (!cart) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }
  },

  /**
   * Invariant I5: Cart must exist for user
   * Used for management operations (update, remove, clear)
   *
   * @throws BusinessError with code "CART_NOT_FOUND" if cart doesn't exist
   */
  async assertCartExistsForUser(userId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }
  },

  // --------------- CartItem Existence (I4) ---------------

  /**
   * Invariant I4: CartItem must exist
   *
   * @throws BusinessError with code "CART_ITEM_NOT_FOUND" if item doesn't exist
   */
  async assertCartItemExists(cartItemId: number): Promise<void> {
    const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } })
    if (!item) {
      throw new BusinessError("Cart item not found", 404, "CART_ITEM_NOT_FOUND")
    }
  },

  /**
   * Invariant I4: CartItem must exist for user
   * Used for update and remove operations
   *
   * @param userId - User ID
   * @param productId - Product ID to find in cart
   * @throws BusinessError with code "CART_ITEM_NOT_FOUND" if item doesn't exist
   */
  async assertCartItemExistsForUser(userId: number, productId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { where: { productId } } }
    })

    if (!cart || cart.items.length === 0) {
      throw new BusinessError("Cart item not found", 404, "CART_ITEM_NOT_FOUND")
    }
  },
}
