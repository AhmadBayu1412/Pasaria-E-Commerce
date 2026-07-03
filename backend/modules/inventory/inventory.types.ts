// ============================================================
// INVENTORY DOMAIN TYPES
// Phase 4 Step 4: Inventory Foundation
// Phase 4 Step 5: Added Application Service types
//
// Minimal types - returns data for Step 5 (Checkout)
// ============================================================

export interface ValidateStockInput {
  readonly productId: number
  readonly quantity: number
}

// Returns product data so Checkout (Step 5) doesn't need to query again
export interface ValidateStockResult {
  readonly productId: number
  readonly availableStock: number
}

// ============================================================
// STEP 5: APPLICATION SERVICE USE TYPES
// ============================================================

/**
 * Input for validateCartItemForCheckout (Application Service use)
 */
export interface ValidateCartItemForCheckoutInput {
  readonly productId: number
  readonly quantity: number
}

/**
 * Result for validateCartItemForCheckout (Application Service use)
 * Returns status with reason instead of throwing
 */
export interface ValidateCartItemForCheckoutResult {
  readonly productId: number
  readonly requestedQuantity: number
  readonly availableStock: number
  readonly status: "VALID" | "INVALID"
  readonly reason?: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK"
}
