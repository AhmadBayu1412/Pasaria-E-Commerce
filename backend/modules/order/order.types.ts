// ============================================================
// ORDER DOMAIN TYPES
// Phase 4 Step 6: Order Draft Foundation
//
// Philosophy:
// - Order is a HISTORICAL RECORD (snapshot)
// - Order does NOT query Product after creation
// - OrderItem is a PURE SNAPSHOT (no relation to Product)
// ============================================================

import { Prisma } from "@prisma/client"

// ----- Prisma Payload Types -----
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true }
}>

// ----- Input Types -----
export interface CreateDraftInput {
  readonly checkoutPreview: import("../checkout/checkout.types.js").CheckoutPreview
}

// ----- Order Snapshot (Immutable after creation) -----
export interface OrderItemSnapshot {
  readonly productId: number
  readonly productName: string
  readonly unitPrice: number
  readonly quantity: number
  readonly subtotal: number
}

export interface OrderDraft {
  readonly id: number
  readonly userId: number
  readonly status: "DRAFT"
  readonly items: ReadonlyArray<OrderItemSnapshot>
  readonly totalQuantity: number
  readonly totalItemCount: number
  readonly subtotal: number
  readonly createdAt: Date
}

// ----- Internal Types -----
export interface OrderItemData {
  readonly productId: number
  readonly productName: string
  readonly unitPrice: number
  readonly quantity: number
  readonly subtotal: number
}

export interface OrderTotals {
  readonly totalQuantity: number
  readonly totalItemCount: number
  readonly subtotal: number
}
