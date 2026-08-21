// ============================================================
// PAYMENT INTENT TYPES
// Phase 5 Step 3: Create Payment Intent
//
// Philosophy:
// - Minimal types for Step 3
// - Returns DTO (not raw entity) for API stability
// - No gateway-specific types (Step 4+)
// ============================================================

// Import dari shared/config untuk type safety
// Prisma enum PaymentProvider disalin karena tidak bisa diimport langsung
export type PaymentProvider = 'STUB' | 'MIDTRANS' | 'XENDIT';

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
  readonly externalReference: string;
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
