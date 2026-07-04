// ============================================================
// ORDER LIFECYCLE TYPES
// Phase 5 Step 1: Order Lifecycle Foundation
//
// Philosophy:
// - STRICTLY MINIMAL for Step 1
// - NO knowledge of future steps
// - NO payment, webhook, timeout, trigger types
// - Only what is needed NOW
// ============================================================

// ----- Order Status -----
/**
 * Order Status — Complete Lifecycle
 *
 * Step 1 Scope:
 * - DRAFT: Created from checkout (Phase 4)
 * - WAITING_PAYMENT: Payment intent created, awaiting confirmation
 * - PAID: Payment confirmed
 * - EXPIRED: Payment timeout exceeded
 * - CANCELLED: Order cancelled
 *
 * NOT in Step 1:
 * - SHIPPING, DELIVERED (Phase 6)
 */
export type OrderStatus =
  | 'DRAFT' // Checkout complete, awaiting payment initiation
  | 'WAITING_PAYMENT' // Payment intent created, awaiting confirmation
  | 'PAID' // Payment confirmed
  | 'EXPIRED' // Payment timeout exceeded
  | 'CANCELLED'; // Order cancelled

// ----- State Machine Definition -----
/**
 * State Transition Map
 * Defines EXACTLY which transitions are allowed
 *
 * Step 1: Only defines the rules
 * Step 3: Will call DRAFT → WAITING_PAYMENT
 * Step 6: Will call WAITING_PAYMENT → PAID
 * Step 8: Will call WAITING_PAYMENT → EXPIRED
 */
export const OrderStateTransitions = {
  DRAFT: {
    canTransitionTo: ['WAITING_PAYMENT', 'CANCELLED'] as const,
  },
  WAITING_PAYMENT: {
    canTransitionTo: ['PAID', 'EXPIRED', 'CANCELLED'] as const,
  },
  PAID: {
    canTransitionTo: [] as const, // Terminal
  },
  EXPIRED: {
    canTransitionTo: [] as const, // Terminal
  },
  CANCELLED: {
    canTransitionTo: [] as const, // Terminal
  },
} as const satisfies Record<
  OrderStatus,
  { canTransitionTo: readonly OrderStatus[] }
>;

// ----- Terminal States -----
export const TERMINAL_STATES: readonly OrderStatus[] = [
  'PAID',
  'EXPIRED',
  'CANCELLED',
] as const;

// ----- Payable States -----
/**
 * States where payment CAN be initiated
 * Currently only DRAFT, but extensible
 */
export const PAYABLE_STATES: readonly OrderStatus[] = ['DRAFT'] as const;
