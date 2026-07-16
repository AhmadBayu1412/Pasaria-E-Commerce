// ============================================================
// ORDER DOMAIN TYPES
// Phase 4 Step 6: Order Draft Foundation
// Phase 4 Step 7: Order State Machine
// Phase 5 Step 1: Order Lifecycle Foundation
//
// Philosophy:
// - Order is a HISTORICAL RECORD (snapshot)
// - Order does NOT query Product after creation
// - OrderItem is a PURE SNAPSHOT (no relation to Product)
// ============================================================

import type { Prisma } from '@prisma/client';
import type { OrderStatus } from './order-lifecycle.types.js';

// ----- Prisma Payload Types -----
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true }
}>;

// ----- Input Types -----
export interface CreateDraftInput {
  readonly checkoutPreview: import('../checkout/checkout.types.js').CheckoutPreview;
}

/**
 * Create Draft Input with Transaction Client
 */
export interface CreateDraftTxInput extends CreateDraftInput {
  readonly tx: Prisma.TransactionClient;
}

// ----- Order Status (Phase 5 Step 1) -----
/**
 * Order Status — Complete Lifecycle
 * Enhanced from Phase 4 to support payment lifecycle
 *
 * Note: OrderStatus is now defined in order-lifecycle.types.ts
 * This re-export maintains backward compatibility
 */
export type { OrderStatus } from './order-lifecycle.types.js';

// Re-export from lifecycle module for convenience
export {
  OrderStateTransitions,
  TERMINAL_STATES,
  PAYABLE_STATES,
} from './order-lifecycle.types.js';

/**
 * State transition validation result
 */
export interface StateTransitionResult {
  readonly isValid: boolean;
  readonly currentState: OrderStatus;
  readonly targetState: OrderStatus;
  readonly reason?: string;
}

// ----- Order Snapshot (Immutable after creation) -----
export interface OrderItemSnapshot {
  readonly productId: number;
  readonly productName: string;
  readonly productImage?: string | null;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly subtotal: number;
}

export interface OrderDraft {
  readonly id: number;
  readonly userId: number;
  readonly status: OrderStatus;
  readonly items: ReadonlyArray<OrderItemSnapshot>;
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
  // 💰 FINANCIAL FIELDS - Fixes NaN issue
  readonly shippingFee: number;
  readonly tax: number;
  readonly total: number;
  // 📍 SHIPPING INFO
  readonly shippingName?: string;
  readonly shippingPhone?: string;
  readonly shippingAddress?: string;
  readonly shippingCity?: string;
  readonly shippingPostalCode?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ----- Internal Types -----
export interface OrderItemData {
  readonly productId: number;
  readonly productName: string;
  readonly productImage?: string | null;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly subtotal: number;
}

export interface OrderTotals {
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
}
