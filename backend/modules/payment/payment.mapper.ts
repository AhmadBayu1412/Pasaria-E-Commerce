// ============================================================
// PAYMENT MAPPER
// Phase 5 Step 2: Data Transformation
//
// Philosophy:
// - Mapper transforms data between layers
// - No business logic in mapper
// - No database access in mapper
// ============================================================

import type { Payment, PaymentViewDTO } from './payment.types.js';
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
} as const;
