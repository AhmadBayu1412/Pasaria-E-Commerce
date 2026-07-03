// ============================================================
// ORDER DOMAIN TYPES
// Phase 4 Step 6: Order Draft Foundation
// Phase 4 Step 7: Order State Machine
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
}>;

// ----- Input Types -----
export interface CreateDraftInput {
  readonly checkoutPreview: import("../checkout/checkout.types.js").CheckoutPreview;
}

/**
 * Create Draft Input with Transaction Client
 */
export interface CreateDraftTxInput extends CreateDraftInput {
  readonly tx: Prisma.TransactionClient;
}

// ----- Order Status (Complete State Machine) -----
/**
 * Order Status — Complete State Machine
 * Defined BEFORE implementation to prevent future refactor
 */
export type OrderStatus =
  | "DRAFT" // Created, pending confirmation
  | "CONFIRMED" // Checkout complete, awaiting payment
  | "PAID" // Payment received (Future)
  | "SHIPPING" // Order being shipped (Future)
  | "DELIVERED" // Order delivered (Future)
  | "CANCELLED" // Order cancelled
  | "EXPIRED"; // Session timeout (Step 8)

/**
 * State Transition Map
 * Defines valid transitions between states
 */
export const OrderStateTransitions = {
  DRAFT: {
    canTransitionTo: ["CONFIRMED", "CANCELLED", "EXPIRED"] as const,
    triggers: {
      CONFIRMED: "Checkout complete",
      CANCELLED: "User cancellation",
      EXPIRED: "Session timeout",
    },
  },
  CONFIRMED: {
    canTransitionTo: ["PAID", "CANCELLED"] as const,
    triggers: {
      PAID: "Payment success",
      CANCELLED: "Refund request",
    },
  },
  PAID: {
    canTransitionTo: ["SHIPPING", "CANCELLED"] as const,
  },
  SHIPPING: {
    canTransitionTo: ["DELIVERED", "CANCELLED"] as const,
  },
  DELIVERED: {
    canTransitionTo: [] as const, // Terminal state
  },
  CANCELLED: {
    canTransitionTo: [] as const, // Terminal state
  },
  EXPIRED: {
    canTransitionTo: [] as const, // Terminal state
  },
} as const;

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
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ----- Internal Types -----
export interface OrderItemData {
  readonly productId: number;
  readonly productName: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly subtotal: number;
}

export interface OrderTotals {
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
}
