// ============================================================
// GATEWAY TYPES
// Phase 5 Step 4: Gateway Abstraction
//
// Philosophy:
// - Domain Language ONLY (no Midtrans/Xendit terms)
// - Minimal types for Step 4 scope
// - Clear separation from PaymentStatus (DB) and ChargeStatus (Gateway)
// ============================================================

// ----- Charge Status -----
/**
 * ChargeStatus represents the state of a charge at the GATEWAY level.
 * NOT the same as PaymentStatus which is at the DATABASE level.
 *
 * Naming Philosophy:
 * - CREATED: Charge successfully created, waiting for payment
 * - FAILED: Charge creation failed (e.g., provider error)
 *
 * Note: SUCCESS/PENDING are NOT included because Step 4 hasn't reached
 * payment confirmation yet. Those statuses will be added in Step 6.
 */
export type ChargeStatus = 'CREATED' | 'FAILED';

export interface ChargeFailureInfo {
  readonly reason: string;
  readonly failedAt: Date;
}

// ----- Charge Request -----
/**
 * Request to create a charge.
 * Domain Language - no provider-specific fields.
 */
export interface CreateChargeRequest {
  readonly paymentId: number;
  readonly orderId: number;
  readonly amount: number;
  readonly currency: string;
  readonly returnUrl?: string;
}

// ----- Charge Metadata -----
/**
 * Metadata for correlating gateway events with domain entities.
 * Minimal: only what's needed for webhook lookup.
 */
export interface ChargeMetadata {
  readonly orderId: number;
  readonly paymentId: number;
}

// ----- Charge Result -----
/**
 * Result of a successful charge creation.
 * Domain Language - translated from provider response.
 */
export interface CreateChargeResult {
  readonly chargeStatus: ChargeStatus;
  readonly gatewayTransactionId: string;
  readonly redirectUrl: string | null;
  readonly metadata: ChargeMetadata;
  readonly createdAt: Date;
}
