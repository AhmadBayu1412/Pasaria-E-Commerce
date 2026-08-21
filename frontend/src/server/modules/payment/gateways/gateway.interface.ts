// ============================================================
// PAYMENT GATEWAY INTERFACE
// Phase 5 Step 4: Gateway Abstraction
// Phase 5 Step 8: Extended with getTransactionStatus()
//
// Philosophy:
// - Interface owned by DOMAIN
// - Implementation owned by INFRASTRUCTURE
// - Domain does NOT know how provider works
// - Provider MUST conform to domain contract
// ============================================================

import type { CreateChargeRequest, CreateChargeResult } from './gateway.types';

export interface PaymentGateway {
  /**
   * Create Charge
   *
   * Translates: Domain Request → Provider Request → Domain Result
   *
   * @param request - Charge request in domain language
   * @returns Charge result in domain language
   * @throws PaymentGatewayError - Error translated to domain language
   */
  createCharge(request: CreateChargeRequest): Promise<CreateChargeResult>;

  /**
   * Get Transaction Status from Provider
   * Phase 5 Step 8: Added for Recovery Engine
   *
   * Used by Recovery Engine to sync status with gateway.
   *
   * @param externalReference - Our payment identity (externalReference)
   * @returns Normalized transaction status
   * @throws PaymentGatewayError - On provider communication errors
   */
  getTransactionStatus(
    externalReference: string,
  ): Promise<GatewayTransactionStatus>;
}

/**
 * Gateway Transaction Status
 * Normalized from provider-specific response.
 *
 * This is the domain representation of a transaction's current state at the gateway.
 */
export interface GatewayTransactionStatus {
  readonly transactionId: string; // Provider's transaction ID
  readonly externalReference: string; // Our reference
  readonly status: GatewayStatus; // Normalized status
  readonly amount: number; // Amount for validation
  readonly currency: string;
  readonly paidAt?: Date; // When payment was made
  readonly updatedAt: Date;
}

/**
 * Normalized Gateway Status
 * Domain language - no provider-specific terms.
 *
 * Kept separate from PaymentStatus for domain isolation.
 * Recovery layer talks in GatewayStatus, ConfirmationService maps to PaymentStatus.
 */
export type GatewayStatus =
  | 'PENDING' // Waiting for payment
  | 'SUCCESS' // Payment confirmed
  | 'FAILED' // Payment failed
  | 'EXPIRED' // Payment timeout
  | 'CANCELLED'; // Payment cancelled
