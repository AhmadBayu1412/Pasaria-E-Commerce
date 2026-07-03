// ============================================================
// CHECKOUT DOMAIN TYPES
// Phase 4 Step 5: Checkout Orchestration Foundation
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
  readonly quantity: number
  readonly availableStock: number
  readonly status: "VALID" | "INVALID"
  readonly reason?: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK"
}
