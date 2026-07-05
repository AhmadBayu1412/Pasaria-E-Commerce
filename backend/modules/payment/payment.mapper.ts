// ============================================================
// PAYMENT MAPPER
// Phase 5 Step 2: Data Transformation
// Phase 5 Step 8: Extended with toRecoveryCandidate()
//
// Philosophy:
// - Mapper transforms data between layers
// - No business logic in mapper
// - No database access in mapper
// ============================================================

import type { Payment, PaymentViewDTO } from './payment.types.js';
import type { RecoveryCandidate } from './recovery/payment-recovery.types.js';
import type { Prisma } from '@prisma/client';

// ----- Prisma Payload Type -----
type PaymentPrisma = Prisma.PaymentGetPayload<Record<string, never>>;

export const PaymentMapper = {
  /**
   * Transform Prisma model → Domain
   */
  toDomain(payment: PaymentPrisma): Payment {
    return {
      id: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider as Payment['provider'],
      status: payment.status as Payment['status'],
      // Phase 5 Step 7-8: Gateway integration fields
      externalReference: payment.externalReference ?? '',
      snapToken: payment.snapToken,
      gatewayTransactionId: payment.gatewayTransactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  },

  /**
   * Transform Domain → View DTO (for API)
   */
  toView(payment: Payment): PaymentViewDTO {
    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      status: payment.status,
      createdAt: payment.createdAt,
    };
  },

  /**
   * Transform Prisma model → Recovery Candidate
   * Phase 5 Step 8: Added for Recovery Engine
   *
   * Maps a Prisma Payment to a RecoveryCandidate for the recovery engine.
   */
  toRecoveryCandidate(payment: PaymentPrisma): RecoveryCandidate {
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      externalReference: payment.externalReference ?? '',
      provider: payment.provider as RecoveryCandidate['provider'],
      snapToken: payment.snapToken,
      status: 'PENDING', // Only PENDING payments are candidates
      createdAt: payment.createdAt,
    };
  },
} as const;
