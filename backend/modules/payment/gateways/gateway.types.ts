// ============================================================
// GATEWAY TYPES
// Phase 5 Step 7: Gateway Abstraction with Provider Identity
//
// Philosophy:
// - Domain Language ONLY (no Midtrans/Xendit terms)
// - Clear separation from PaymentStatus (DB) and ChargeStatus (Gateway)
// - Payment Identity Model:
//   - externalReference: Identity milik kita (untuk webhook lookup)
//   - snapToken: Token untuk redirect (dari Snap API)
//   - gatewayTransactionId: Identity gateway (dari webhook)
//
// Architecture Note:
// - externalReference format "PAY-{id}-{orderId}" adalah implementation detail
// - Business tidak boleh bergantung pada format string ini
// - Future: Mungkin berubah menjadi UUID atau ULID
// ============================================================

// Re-export ProviderType for convenience in payment module
// Import dari shared/config untuk single source of truth
export type { ProviderType } from '../../../shared/config/gateway.config.js';

// ----- Charge Status -----
/**
 * ChargeStatus represents the state of a charge at the GATEWAY level.
 * NOT the same as PaymentStatus which is at the DATABASE level.
 *
 * Naming Philosophy:
 * - CREATED: Charge successfully created, waiting for payment
 * - FAILED: Charge creation failed (e.g., provider error)
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
 * 
 * CHANGE v2: Tambahkan externalReference.
 * externalReference dibuat di DOMAIN layer, bukan di Mapper.
 */
export interface CreateChargeRequest {
  readonly paymentId: number;
  readonly orderId: number;
  readonly amount: number;
  readonly currency: string;
  readonly returnUrl?: string;

  /**
   * External reference untuk correlating webhook.
   * Dibuat di PaymentIntentService / Domain Layer.
   * Format: "PAY-{paymentId}-{orderId}"
   * Mapper TIDAK membuat ini - hanya menerjemahkan.
   */
  readonly externalReference: string;
}

// ----- Charge Metadata -----
/**
 * Metadata for correlating gateway events with domain entities.
 * Minimal: only what's needed for webhook lookup.
 */
export interface ChargeMetadata {
  readonly orderId: number;
  readonly paymentId: number;
  readonly externalReference: string;
}

// ----- Charge Result -----
/**
 * Result of a successful charge creation.
 * Domain Language - translated from provider response.
 * 
 * CHANGE v2: Pisahkan snapToken dan gatewayTransactionId.
 * 
 * snapToken = untuk redirect ke halaman pembayaran (dari Snap API)
 * gatewayTransactionId = dari webhook, untuk rekonsiliasi
 */
export interface CreateChargeResult {
  readonly chargeStatus: ChargeStatus;

  /**
   * Snap Token - token untuk membuka halaman pembayaran.
   * Dari: Midtrans Snap Token Response
   * Usage: Redirect user ke Midtrans payment page
   */
  readonly snapToken: string;

  /** URL redirect ke halaman pembayaran provider */
  readonly redirectUrl: string;

  /**
   * External reference - identity milik kita.
   * Dari: CreateChargeRequest.externalReference
   * Usage: Correlating webhook
   */
  readonly externalReference: string;

  /** Metadata untuk correlating webhook */
  readonly metadata: ChargeMetadata;

  /** Timestamp dari gateway response */
  readonly createdAt: Date;
}
