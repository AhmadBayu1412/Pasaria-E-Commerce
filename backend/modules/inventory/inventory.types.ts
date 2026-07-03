// ============================================================
// INVENTORY DOMAIN TYPES
// Phase 4 Step 4: Inventory Foundation
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
