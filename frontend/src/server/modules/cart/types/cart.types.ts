// ============================================================
// CART DOMAIN TYPES (Anemic Model)
// Aggregate Root: Cart
// Child Entity: CartItem
// ============================================================
// PHASE 4 - Step 3: Cart Management
// Updated: Added new service types and unified response types
// PHASE 4 - Step 7: Added Transaction types for clearCartTx
// ============================================================

import type { Prisma } from "@prisma/client"

// --------------- Aggregate Root -------------------
export interface Cart {
  readonly id: number;
  readonly userId: number;
  readonly items: CartItem[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// --------------- Child Entity -------------------
export interface CartItem {
  readonly id: number;
  readonly cartId: number;
  readonly productId: number;
  readonly quantity: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// --------------- Prisma Payload Types -------------------
export type CartWithItems = Prisma.CartGetPayload<{
  include: { items: true }
}>;

export type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: { product: true }
}>;

// --------------- Service Input Types -------------------
export interface AddToCartServiceInput {
  readonly userId: number;
  readonly productId: number;
  readonly quantity?: number; // default 1
}

export interface GetCartServiceInput {
  readonly userId: number;
}

export interface UpdateQuantityServiceInput {
  readonly userId: number;
  readonly productId: number;
  readonly quantity: number; // ABSOLUTE value, not increment
}

export interface RemoveItemServiceInput {
  readonly userId: number;
  readonly productId: number;
}

export interface ClearCartServiceInput {
  readonly userId: number;
}

// --------------- Unified Cart View (Step 3) -------------------
/**
 * CartView - Unified response type for GET /cart
 *
 * Provides a consistent response shape regardless of whether
 * the Cart has been created in the database (lazy creation).
 *
 * Controller never needs to branch on "exists" - always returns CartView.
 */
export interface CartItemView {
  readonly id: number;
  readonly productId: number;
  readonly quantity: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CartView {
  readonly cartId: number | null; // null if cart hasn't been created yet
  readonly userId: number;
  readonly items: CartItemView[];
  readonly itemCount: number; // items.length (jumlah jenis produk)
  readonly totalQuantity: number; // sum of all item quantities
  readonly createdAt: string | null; // null if cart hasn't been created yet
  readonly updatedAt: string | null; // null if cart hasn't been created yet
}

// --------------- Service Output Types -------------------

/**
 * Internal result type for addToCart operation
 * Contains metadata used for logging/debugging only
 */
interface AddToCartInternalResult {
  readonly cart: CartWithItems;
  readonly itemCount: number; // items.length - jumlah jenis produk
  readonly totalQuantity: number; // sum of all item quantities
  readonly _meta: {
    readonly action: "CREATED" | "INCREMENTED"; // Internal use only
  };
}

// Export for internal service use
export type { AddToCartInternalResult as AddToCartResult };

/**
 * GetCartResult - Always returns CartView
 * Never branches - Controller gets consistent shape
 */
export type GetCartResult = CartView;

/**
 * Result for updateQuantity operation
 */
export interface UpdateQuantityResult {
  readonly cart: CartWithItems;
  readonly previousQuantity: number;
  readonly newQuantity: number;
  readonly itemCount: number;
  readonly totalQuantity: number;
}

/**
 * Result for removeItem operation
 * Note: Cart still exists, items may be empty
 */
export interface RemoveItemResult {
  readonly cart: CartWithItems;
  readonly removedProductId: number;
  readonly itemCount: number;
  readonly totalQuantity: number;
}

/**
 * Result for clearCart operation
 * Note: Cart still exists with empty items
 */
export interface ClearCartResult {
  readonly cart: CartWithItems;
  readonly itemsRemoved: number;
}

// ============================================================
// STEP 7: TRANSACTION TYPES
// ============================================================

/**
 * Clear Cart Input — Inside Transaction
 */
export interface ClearCartTxInput {
  readonly userId: number;
  readonly cartId: number;
}

/**
 * Clear Cart Result — Inside Transaction
 */
export interface ClearCartTxResult {
  readonly itemsRemoved: number;
  readonly cartId: number;
}

// --------------- Computed Types -------------------
export interface CartComputedFields {
  readonly itemCount: number; // items.length - jumlah jenis produk
  readonly totalQuantity: number; // items.reduce((sum, i) => sum + i.quantity, 0)
}

// --------------- Aggregate Invariants (Complete - Step 3) -------------------
/**
 * I1: CartItem.quantity >= 1
 * I2: CartItem.quantity NEVER = 0 (invariant hard)
 *     → Jika quantity menjadi 0, item DIHAPUS, bukan disimpan
 * I3: CartItem.quantity <= BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY
 * I4: CartItem.Product EXISTS
 * I5: Cart.User IS UNIQUE
 * I6: CartItem.Product IS UNIQUE per Cart (DB constraint)
 * I7: Empty Cart adalah valid business state (Cart tetap ada dengan items=[])
 */
export const CART_INVARIANTS = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 99,
  QUANTITY_MUST_BE_POSITIVE: (qty: number) => qty >= 1,
  QUANTITY_WITHIN_LIMIT: (qty: number) => qty >= 1 && qty <= 99,
  QUANTITY_NEVER_ZERO: (qty: number) => qty > 0, // I2
} as const;
