// ============================================================
// CART DTOs (Data Transfer Objects)
// Step 1: Schema definition only
// API endpoints: Step 2
// ============================================================

// ----- Request DTOs -----
// NOTE: AddToCartRequestDTO is similar to AddToCartServiceInput
// but for API layer. Keeping separate for API contract clarity.

// Re-export for convenience
export type { AddToCartInput } from "../validation/cart.validation.js"

export interface UpdateCartItemRequestDTO {
  readonly quantity: number
}

export interface RemoveFromCartRequestDTO {
  readonly productId: number
}

export interface ClearCartRequestDTO {
  // No body required - uses authenticated user
}

// ----- Response DTOs -----
export interface CartItemResponseDTO {
  readonly id: number
  readonly productId: number
  readonly quantity: number
  readonly createdAt: string
  readonly updatedAt: string

  // --- Future Step (Pricing - Step 5+) ---
  // readonly price: number
  // readonly productName: string
  // readonly subtotal: number
}

export interface CartResponseDTO {
  readonly id: number
  readonly userId: number
  readonly items: CartItemResponseDTO[]
  readonly itemCount: number      // DEFINISI: items.length (jumlah jenis produk)
  readonly totalQuantity: number  // DEFINISI: sum(items.quantity)
  readonly createdAt: string
  readonly updatedAt: string

  // --- Future Step (Pricing - Step 5+) ---
  // readonly subtotal: number
  // readonly totalPrice: number
}

// ----- Response Wrapper -----
export interface CartMutationResponseDTO {
  readonly success: true
  readonly data: CartResponseDTO
  readonly message: string
}

// ----- Error Response -----
export interface CartErrorResponseDTO {
  readonly success: false
  readonly error: {
    readonly code: string
    readonly message: string
  }
}
