// ============================================================
// ORDER DTOs (Data Transfer Objects)
// Phase 4 Step 6: Order Draft Foundation
// ============================================================

// ----- Response DTOs -----
export interface OrderDraftResponseDTO {
  readonly success: true
  readonly data: {
    readonly orderId: number
    readonly status: "DRAFT"
    readonly totalQuantity: number
    readonly totalItemCount: number
    readonly subtotal: number
    readonly items: ReadonlyArray<{
      readonly productId: number
      readonly productName: string
      readonly unitPrice: number
      readonly quantity: number
      readonly subtotal: number
    }>
    readonly createdAt: string
  }
}

export interface OrderErrorResponseDTO {
  readonly success: false
  readonly error: {
    readonly code: string
    readonly message: string
  }
}
