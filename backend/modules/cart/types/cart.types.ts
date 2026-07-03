// ============================================================
// CART DOMAIN TYPES (Anemic Model)
// Aggregate Root: Cart
// Child Entity: CartItem
// ============================================================

import type { Prisma } from "@prisma/client"

// --------------- Aggregate Root -------------------
export interface Cart {
  readonly id: number
  readonly userId: number
  readonly items: CartItem[]
  readonly createdAt: Date
  readonly updatedAt: Date
}

// --------------- Child Entity -------------------
export interface CartItem {
  readonly id: number
  readonly cartId: number
  readonly productId: number
  readonly quantity: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

// --------------- Prisma Payload Types -------------------
export type CartWithItems = Prisma.CartGetPayload<{
  include: { items: true }
}>

export type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: { product: true }
}>

// --------------- Computed Types -------------------
export interface CartComputedFields {
  readonly itemCount: number      // items.length - jumlah jenis produk
  readonly totalQuantity: number // items.reduce((sum, i) => sum + i.quantity, 0)
}

// --------------- Aggregate Invariants -------------------
export const CART_INVARIANTS = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 99,
  QUANTITY_MUST_BE_POSITIVE: (qty: number) => qty >= 1,
  QUANTITY_WITHIN_LIMIT: (qty: number) => qty >= 1 && qty <= 99,
} as const
