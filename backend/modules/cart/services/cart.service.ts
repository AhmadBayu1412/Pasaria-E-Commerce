// ============================================================
// CART SERVICE - Domain Behavior Implementation
// Phase 4 Step 2: Add To Cart
// Phase 4 Step 3: Cart Management (Get, Update, Remove, Clear)
// Phase 4 Step 7: Add clearCartTx() for atomic transactions
//
// Responsible for:
// - Lazy Cart creation
// - Add item to Cart (create or increment)
// - Get Cart (returns unified CartView)
// - Update item quantity
// - Remove item from cart
// - Clear all items from cart
// - All CartItem modifications through this service
//
// NOT responsible for:
// - Inventory management (Step 4)
// - Checkout (Step 5+)
// - Pricing (Step 5+)
// ============================================================
// PHASE 4 - Step 3: Cart Management
// ============================================================

import { prisma } from "../../../infra/db/prisma.js"
import { CartRules } from "../rules/cart.rules.js"
import { BusinessError } from "../../../shared/errors/business.error.js"
import type { Prisma } from "@prisma/client"
import type {
  AddToCartServiceInput,
  AddToCartResult,
  CartWithItems,
  GetCartServiceInput,
  GetCartResult,
  CartView,
  CartItemView,
  UpdateQuantityServiceInput,
  UpdateQuantityResult,
  RemoveItemServiceInput,
  RemoveItemResult,
  ClearCartServiceInput,
  ClearCartResult,
  ClearCartTxInput,
  ClearCartTxResult,
} from "../types/cart.types.js"

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

  // ============================================================
  // STEP 3: CART MANAGEMENT METHODS
  // ============================================================

  /**
   * Get Cart - Returns unified CartView
   *
   * Always returns a valid CartView shape, regardless of whether
   * the Cart exists in the database (lazy creation).
   *
   * Controller never needs to branch on "exists" - always gets
   * the same response structure.
   *
   * @param input - GetCartServiceInput with userId
   * @returns CartView (always valid shape)
   */
  async getCart(input: GetCartServiceInput): Promise<GetCartResult> {
    const { userId } = input

    // Find cart by userId (lazy - may not exist)
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    })

    // Build unified CartView
    if (cart) {
      return buildCartView(cart, cart.id)
    }

    // Cart doesn't exist yet - return empty CartView
    return buildEmptyCartView(userId)
  },

  /**
   * Update Cart Item Quantity
   *
   * REPLACES the quantity, not increments it.
   * Uses absolute quantity value from request.
   *
   * Algorithm:
   * 1. Cart must exist (Business Rule)
   * 2. CartItem must exist for this product (Business Rule)
   * 3. Validate new quantity is valid (1 to MAX) (Business Rule I1 + I2 + I3)
   * 4. Update quantity in transaction
   * 5. Return updated cart
   *
   * @throws BusinessError CART_NOT_FOUND if cart doesn't exist
   * @throws BusinessError CART_ITEM_NOT_FOUND if item doesn't exist
   * @throws BusinessError INVALID_QUANTITY if quantity < 1
   * @throws BusinessError INVALID_QUANTITY_ZERO if quantity = 0
   * @throws BusinessError QUANTITY_EXCEEDS_LIMIT if quantity > MAX
   */
  async updateQuantity(input: UpdateQuantityServiceInput): Promise<UpdateQuantityResult> {
    const { userId, productId, quantity } = input

    // Step 1: Business validation - Cart must exist
    await CartRules.assertCartExistsForUser(userId)

    // Step 2: Execute in transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // 2a: Get cart with item
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      })

      if (!cart) {
        throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
      }

      // 2b: Find the item
      const item = cart.items.find(i => i.productId === productId)
      if (!item) {
        throw new BusinessError("Cart item not found", 404, "CART_ITEM_NOT_FOUND")
      }

      const previousQuantity = item.quantity

      // 2c: Validate new quantity (I1 + I2 + I3)
      CartRules.assertValidUpdateQuantity(quantity)

      // 2d: Update quantity
      await tx.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      })

      // 2e: Fetch updated cart
      const updatedCart = await tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      return {
        cart: updatedCart as CartWithItems,
        previousQuantity,
        newQuantity: quantity,
      }
    })

    // Step 3: Build response
    return {
      cart: result.cart,
      previousQuantity: result.previousQuantity,
      newQuantity: result.newQuantity,
      itemCount: result.cart.items.length,
      totalQuantity: result.cart.items.reduce((sum, item) => sum + item.quantity, 0),
    }
  },

  /**
   * Remove Item from Cart
   *
   * Deletes a single product from the cart.
   * Note: Cart itself is NOT deleted, even if it becomes empty.
   * Empty cart is a valid business state (I7).
   *
   * Algorithm:
   * 1. Cart must exist (Business Rule)
   * 2. CartItem must exist for this product (Business Rule)
   * 3. Delete item in transaction
   * 4. Return cart (may have empty items)
   *
   * @throws BusinessError CART_NOT_FOUND if cart doesn't exist
   * @throws BusinessError CART_ITEM_NOT_FOUND if item doesn't exist
   */
  async removeItem(input: RemoveItemServiceInput): Promise<RemoveItemResult> {
    const { userId, productId } = input

    // Step 1: Business validation - Cart must exist
    await CartRules.assertCartExistsForUser(userId)

    // Step 2: Execute in transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // 2a: Get cart
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      })

      if (!cart) {
        throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
      }

      // 2b: Find the item
      const item = cart.items.find(i => i.productId === productId)
      if (!item) {
        throw new BusinessError("Cart item not found", 404, "CART_ITEM_NOT_FOUND")
      }

      // 2c: Delete item (NOT cart - cart persists)
      await tx.cartItem.delete({
        where: { id: item.id },
      })

      // 2d: Fetch updated cart
      const updatedCart = await tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      return {
        cart: updatedCart as CartWithItems,
        removedProductId: productId,
      }
    })

    // Step 3: Build response
    return {
      cart: result.cart,
      removedProductId: result.removedProductId,
      itemCount: result.cart.items.length,
      totalQuantity: result.cart.items.reduce((sum, item) => sum + item.quantity, 0),
    }
  },

  /**
   * Clear Cart - Remove all items
   *
   * Deletes all CartItems from the cart.
   * Note: Cart itself is NOT deleted.
   * Empty cart is a valid business state (I7).
   *
   * Algorithm:
   * 1. Cart must exist (Business Rule)
   * 2. Delete all items in transaction
   * 3. Return empty cart
   *
   * @throws BusinessError CART_NOT_FOUND if cart doesn't exist
   */
  async clearCart(input: ClearCartServiceInput): Promise<ClearCartResult> {
    const { userId } = input

    // Step 1: Business validation - Cart must exist
    await CartRules.assertCartExistsForUser(userId)

    // Step 2: Execute in transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // 2a: Get cart
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      })

      if (!cart) {
        throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
      }

      const itemsRemoved = cart.items.length

      // 2b: Delete all items (NOT cart - cart persists)
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      // 2c: Fetch updated cart (empty)
      const updatedCart = await tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      return {
        cart: updatedCart as CartWithItems,
        itemsRemoved,
      }
    })

    // Step 3: Build response
    return {
      cart: result.cart,
      itemsRemoved: result.itemsRemoved,
    }
  },

  /**
   * Get Cart by User ID (Internal Use)
   * Returns null if cart doesn't exist (lazy - cart not created yet)
   *
   * NOTE: This is for internal use only.
   * Use getCart() for API responses (returns unified CartView).
   */
  async getCartByUserId(userId: number): Promise<CartWithItems | null> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    })
    return cart as CartWithItems | null
  },

  // ============================================================
  // STEP 5: CART SNAPSHOT FOR APPLICATION SERVICE
  // ============================================================

  /**
   * Get Cart Snapshot — Application Service Use
   *
   * Returns structured contract that Application Services can consume
   * without knowing internal Cart entity structure.
   *
   * Key Principles:
   * - Cart computes its own fields (totalQuantity)
   * - Application Service only reads, never computes
   * - No internal entity exposed outside domain
   */
  async getCartSnapshot(userId: number): Promise<CartSnapshot> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    })

    if (!cart) {
      return {
        cartId: null,
        userId,
        items: [],
        totalQuantity: 0,
      }
    }

    return {
      cartId: cart.id,
      userId: cart.userId,
      items: cart.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      totalQuantity: cart.items.reduce((sum, i) => sum + i.quantity, 0),
    }
  },

  // ============================================================
  // STEP 7: CLEAR CART FOR TRANSACTION
  // ============================================================

  /**
   * Clear Cart — Inside Transaction
   *
   * Deletes all CartItems from the cart within an existing transaction.
   * Used by CheckoutService.completeCheckout() for atomic operations.
   *
   * @param tx - Prisma.TransactionClient (REQUIRED)
   * @param input - ClearCartTxInput with userId + cartId
   * @returns ClearCartTxResult with itemsRemoved and cartId
   *
   * NOTE: Does NOT validate cart existence - assumes caller has validated
   */
  async clearCartTx(
    tx: Prisma.TransactionClient,
    input: ClearCartTxInput
  ): Promise<ClearCartTxResult> {
    const { userId, cartId } = input

    // Get cart to count items
    const cart = await tx.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    })

    if (!cart) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }

    // Count items before deletion
    const itemsRemoved = cart.items.length

    // Delete all items (NOT cart - cart persists)
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    return {
      itemsRemoved,
      cartId: cart.id,
    }
  },
} as const

/**
 * Cart Snapshot Contract
 * Stable interface for cross-boundary communication
 * Used by Application Services (e.g., Checkout)
 */
export interface CartSnapshot {
  readonly cartId: number | null;
  readonly userId: number;
  readonly items: ReadonlyArray<{
    readonly productId: number;
    readonly quantity: number;
  }>;
  readonly totalQuantity: number;
}

// ----- Helper Functions -----

function buildCartResponse(cart: CartWithItems, action: "CREATED" | "INCREMENTED"): AddToCartResult {
  return {
    cart,
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    _meta: {
      action, // Internal use only - for logging/debugging
    },
  }
}

/**
 * Build unified CartView from cart data
 * Used for GET /cart response
 */
function buildCartView(cart: CartWithItems, cartId: number): CartView {
  const items: CartItemView[] = cart.items.map(item => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }))

  return {
    cartId,
    userId: cart.userId,
    items,
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  }
}

/**
 * Build empty CartView when cart doesn't exist
 * Used for GET /cart response when lazy creation hasn't happened
 */
function buildEmptyCartView(userId: number): CartView {
  return {
    cartId: null,
    userId,
    items: [],
    itemCount: 0,
    totalQuantity: 0,
    createdAt: null,
    updatedAt: null,
  }
}
