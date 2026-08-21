// ============================================================
// PAYMENT DOMAIN TYPES
// Phase 5 Step 2: Payment Domain Foundation
// Phase 5 Step 8: Extended with gateway fields
//
// Philosophy:
// - Payment is a RECORD OF ATTEMPT, not money
// - Payment knows about Order, Order doesn't know about Payment
// - MINIMAL fields for Step 2, grows with future steps
// ============================================================

// ----- Payment Provider -----
/**
 * Supported payment providers
 * Step 2: Only STUB for testing
 * Step 7: Add MIDTRANS, XENDIT, STRIPE
 */
export type PaymentProvider = 'STUB';

// ----- Payment Status -----
/**
 * Payment Status — Represents the state of a payment attempt
 *
 * Step 2 Scope:
 * - PENDING: Intent created, awaiting confirmation
 * - SUCCESS/DECLINED/EXPIRED: Added for completeness, used in later steps
 */
export type PaymentStatus =
  | 'PENDING' // Intent created
  | 'SUCCESS' // Payment confirmed (Step 6+)
  | 'FAILED' // Payment failed (Step 6+)
  | 'CANCELLED' // Payment cancelled by user (Step 6+)
  | 'DECLINED' // Gateway rejected (Step 6+)
  | 'EXPIRED'; // Timeout exceeded (Step 8+)

// ----- Payment Aggregate -----
/**
 * Payment Aggregate
 *
 * Represents a RECORD OF ATTEMPT to pay for an Order.
 * NOT the money itself.
 *
 * Design Decisions (Step 2):
 * - Minimal fields only
 * - providerReference NOT included (Step 7)
 * - expiresAt NOT included (Step 8)
 * - orderId is @index (supports retry - one Order can have many Payments)
 *
 * Phase 5 Step 7-8 Extensions:
 * - externalReference: Identity for webhook correlation
 * - snapToken: Token for redirect to payment page
 * - gatewayTransactionId: Gateway's transaction reference
 */
export interface Payment {
  readonly id: number;
  readonly orderId: number; // FK to Order
  readonly userId: number;

  readonly amount: number; // Amount in smallest unit (rupiah)
  readonly currency: string; // 'IDR'

  readonly provider: PaymentProvider;

  readonly status: PaymentStatus;

  // Phase 5 Step 7-8: Gateway integration fields
  readonly externalReference: string; // Identity for webhook correlation
  readonly snapToken: string | null; // Token for redirect to payment page
  readonly gatewayTransactionId: string | null; // Gateway's transaction reference

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ----- Payment Creation Input -----
/**
 * Input needed to create a Payment
 */
export interface CreatePaymentInput {
  readonly orderId: number;
  readonly userId: number;
  readonly amount: number;
  readonly currency: string; // 'IDR'
  readonly provider: PaymentProvider;
}

// ----- Payment View DTO -----
/**
 * What frontend sees
 */
export interface PaymentViewDTO {
  readonly id: number;
  readonly orderId: number;
  readonly amount: number;
  readonly currency: string;
  readonly provider: PaymentProvider;
  readonly status: PaymentStatus;
  readonly createdAt: Date;
}

// ----- Terminal Statuses -----
export const PAYMENT_TERMINAL_STATUSES: readonly PaymentStatus[] = [
  'SUCCESS',
  'DECLINED',
  'EXPIRED',
] as const;

// ----- Active Statuses -----
export const PAYMENT_ACTIVE_STATUSES: readonly PaymentStatus[] = ['PENDING'] as const;
