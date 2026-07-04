// ============================================================
// PAYMENT INTENT TYPES
// Phase 5 Step 3: Create Payment Intent
//
// Philosophy:
// - Minimal types for Step 3
// - Returns DTO (not raw entity) for API stability
// - No gateway-specific types (Step 4+)
// ============================================================

import type { PaymentProvider } from './payment.types.js';

// ----- Input -----
export interface CreatePaymentIntentInput {
  readonly orderId: number;
  readonly userId: number;
  readonly amount: number;
  readonly currency?: string;
  readonly provider?: PaymentProvider;
}

// ----- Result DTO -----
/**
 * DTO for API response
 * Returns structured data, not raw entity
 */
export interface PaymentIntentResultDTO {
  readonly paymentId: number;
  readonly orderId: number;
  readonly amount: number;
  readonly currency: string;
  readonly provider: PaymentProvider;
  readonly status: 'READY_FOR_GATEWAY';
}

// ----- Error Codes (Step 3 scope) -----
export const PaymentIntentErrorCodes = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_TERMINAL: 'ORDER_TERMINAL',
  ORDER_NOT_PAYABLE: 'ORDER_NOT_PAYABLE',
  ORDER_NOT_OWNED: 'ORDER_NOT_OWNED',
  PAYMENT_EXISTS: 'PAYMENT_EXISTS',
} as const;

export type PaymentIntentErrorCode =
  (typeof PaymentIntentErrorCodes)[keyof typeof PaymentIntentErrorCodes];
