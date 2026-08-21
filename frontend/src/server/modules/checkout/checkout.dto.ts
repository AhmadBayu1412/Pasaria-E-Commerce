// ============================================================
// CHECKOUT DTOs (Data Transfer Objects)
// Phase 4 Step 5: Checkout Orchestration Foundation
// ============================================================

// ----- Response DTOs -----
export interface CheckoutPreviewResponseDTO {
  readonly success: true
  readonly data: {
    readonly summary: {
      readonly cartId: number | null
      readonly userId: number
      readonly totalQuantity: number
      readonly isReady: boolean
    }
    readonly items: ReadonlyArray<{
      readonly productId: number
      readonly quantity: number
      readonly availableStock: number
      readonly status: "VALID" | "INVALID"
      readonly reason?: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK"
    }>
    readonly validation: {
      readonly passed: boolean
      readonly failedItems: ReadonlyArray<number>
    }
  }
}

export interface CheckoutErrorResponseDTO {
  readonly success: false
  readonly error: {
    readonly code: string
    readonly message: string
  }
}
