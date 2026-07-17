// ============================================================
// ORDER LIFECYCLE TYPES
// Phase 5 Step 1: Order Lifecycle Foundation
// Extended for complete order lifecycle
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
 * Extended with shipping states:
 * - DRAFT: Created from checkout (Phase 4)
 * - WAITING_PAYMENT: Payment intent created, awaiting confirmation
 * - PAID: Payment confirmed
 * - PROCESSING: Seller preparing items
 * - SHIPPING: Package shipped
 * - DELIVERED: Package delivered to customer
 * - COMPLETED: Customer confirmed delivery
 * - EXPIRED: Payment timeout exceeded
 * - CANCELLED: Order cancelled
 */
export type OrderStatus =
  | 'DRAFT' // Keranjang → Order draft, awaiting payment initiation
  | 'WAITING_PAYMENT' // Payment initiated, awaiting confirmation
  | 'PAID' // Payment confirmed
  | 'PROCESSING' // Seller preparing items
  | 'SHIPPING' // Package shipped
  | 'DELIVERED' // Package delivered to customer
  | 'COMPLETED' // Customer confirmed delivery
  | 'EXPIRED' // Payment timeout exceeded
  | 'CANCELLED'; // Order cancelled

// ----- State Machine Definition -----
/**
 * State Transition Map
 * Defines EXACTLY which transitions are allowed
 */
export const OrderStateTransitions = {
  DRAFT: {
    canTransitionTo: ['WAITING_PAYMENT', 'CANCELLED'] as const,
  },
  WAITING_PAYMENT: {
    canTransitionTo: ['PAID', 'EXPIRED', 'CANCELLED'] as const,
  },
  PAID: {
    canTransitionTo: ['PROCESSING', 'CANCELLED'] as const,
  },
  PROCESSING: {
    canTransitionTo: ['SHIPPING', 'CANCELLED'] as const,
  },
  SHIPPING: {
    canTransitionTo: ['DELIVERED', 'CANCELLED'] as const,
  },
  DELIVERED: {
    canTransitionTo: ['COMPLETED', 'CANCELLED'] as const,
  },
  COMPLETED: {
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
/**
 * Terminal states are final (no more transitions allowed)
 */
export const TERMINAL_STATES: readonly OrderStatus[] = [
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
] as const;

// ----- Payable States -----
/**
 * States where payment CAN be initiated
 * Currently only DRAFT, but extensible
 */
export const PAYABLE_STATES: readonly OrderStatus[] = ['DRAFT'] as const;
