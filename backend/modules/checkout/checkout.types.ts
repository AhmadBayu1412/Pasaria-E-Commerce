// ============================================================
// CHECKOUT DOMAIN TYPES
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 6: Expanded Preview with Product Snapshot
// Phase 4 Step 7: Complete Checkout Transaction
//
// Philosophy:
// - Application Service contract (not Domain Service)
// - Only orchestrates, no business rules
// - Uses domain contracts, not internal entities
// ============================================================

// ----- Input Types -----
export interface InitiateCheckoutInput {
  readonly userId: number;
}

/**
 * Input for complete checkout
 * Minimal - uses existing CheckoutPreview from Step 6
 */
export interface CompleteCheckoutInput {
  readonly userId: number;
}

// ----- Output: Checkout Preview (Nested Structure) -----
export interface CheckoutPreview {
  readonly summary: {
    readonly cartId: number | null;
    readonly userId: number;
    readonly totalQuantity: number;
    readonly totalItemCount: number;
    readonly subtotal: number;
    readonly isReady: boolean;
  };

  readonly items: ReadonlyArray<CheckoutItemPreview>;

  readonly validation: {
    readonly passed: boolean;
    readonly failedItems: ReadonlyArray<number>;
  };
}

export interface CheckoutItemPreview {
  readonly productId: number;
  readonly productName: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly availableStock: number;
  readonly subtotal: number;
  readonly status: "VALID" | "INVALID";
  readonly reason?: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK";
}

/**
 * Result of complete checkout
 * API-friendly - only data that makes sense for response
 */
export interface CompleteCheckoutResult {
  readonly orderId: number;
  readonly status: "DRAFT";
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
  readonly createdAt: Date;
}

/**
 * Reserved inventory item (internal use)
 */
export interface ReservedItem {
  readonly productId: number;
  readonly quantity: number;
  readonly reservedAt: Date;
}

/**
 * Internal result from complete checkout transaction
 */
export interface CompleteCheckoutInternalResult {
  readonly orderId: number;
  readonly status: "DRAFT";
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
  readonly createdAt: Date;
  readonly cartId: number | null;
  readonly itemsRemoved: number;
}
