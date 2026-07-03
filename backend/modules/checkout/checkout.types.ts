// ============================================================
// CHECKOUT DOMAIN TYPES
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 6: Expanded Preview with Product Snapshot
//
// Philosophy:
// - Application Service contract (not Domain Service)
// - Only orchestrates, no business rules
// - Uses domain contracts, not internal entities
// ============================================================

// ----- Input Types -----
export interface InitiateCheckoutInput {
  readonly userId: number
}

// ----- Output: Checkout Preview (Nested Structure) -----
export interface CheckoutPreview {
  readonly summary: {
    readonly cartId: number | null
    readonly userId: number
    readonly totalQuantity: number
    readonly totalItemCount: number    // NEW: Count of distinct items
    readonly subtotal: number         // NEW: Total amount (as number for JSON)
    readonly isReady: boolean
  }

  readonly items: ReadonlyArray<CheckoutItemPreview>

  readonly validation: {
    readonly passed: boolean
    readonly failedItems: ReadonlyArray<number>
  }
}

export interface CheckoutItemPreview {
  readonly productId: number
  readonly productName: string         // NEW: From Product
  readonly unitPrice: number         // NEW: From Product (as number)
  readonly quantity: number
  readonly availableStock: number
  readonly subtotal: number          // NEW: quantity * unitPrice
  readonly status: "VALID" | "INVALID"
  readonly reason?: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK"
}
