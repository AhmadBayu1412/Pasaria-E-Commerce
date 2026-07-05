// ============================================================
// PAYMENT RECOVERY REPOSITORY
// Phase 5 Step 8: Recovery Engine Data Access
//
// Philosophy:
// - Repository pattern for data access
// - Finds payments eligible for status recovery
// - Efficient queries with proper indexes
//
// Recovery Candidate Criteria:
// 1. status = PENDING
// 2. provider = MIDTRANS (or other active providers)
// 3. snapToken IS NOT NULL (payment was initiated)
// 4. createdAt > (now - recoveryWindowHours)
// 5. NOT in terminal state
// ============================================================

import { prisma } from '../../../infra/db/prisma.js';
import { PaymentMapper } from '../payment.mapper.js';
import type { RecoveryCandidate } from './payment-recovery.types.js';

interface FindCandidatesOptions {
  readonly limit: number;
  readonly windowHours: number;
}

export const PaymentRecoveryRepository = {
  /**
   * Find Recovery Candidates
   *
   * Returns payments that are eligible for status recovery.
   *
   * Selection Criteria:
   * 1. status = PENDING (only pending payments need recovery)
   * 2. snapToken IS NOT NULL (payment was initiated)
   * 3. createdAt > (now - windowHours) (within recovery window)
   * 4. provider IN ['MIDTRANS'] (only supported providers)
   *
   * Ordered by createdAt ASC so oldest payments are processed first.
   */
  async findRecoveryCandidates(
    options: FindCandidatesOptions,
  ): Promise<RecoveryCandidate[]> {
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - options.windowHours);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        snapToken: { not: null }, // Must have been initiated
        createdAt: { gte: windowStart }, // Within recovery window
        provider: { in: ['MIDTRANS'] }, // Only supported providers
      },
      orderBy: { createdAt: 'asc' }, // Oldest first
      take: options.limit,
    });

    return payments.map((p) => PaymentMapper.toRecoveryCandidate(p));
  },

  /**
   * Count Recovery Candidates
   *
   * For monitoring and scheduling decisions.
   * Returns the number of payments eligible for recovery.
   */
  async countRecoveryCandidates(windowHours: number): Promise<number> {
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - windowHours);

    return prisma.payment.count({
      where: {
        status: 'PENDING',
        snapToken: { not: null },
        createdAt: { gte: windowStart },
        provider: { in: ['MIDTRANS'] },
      },
    });
  },

  /**
   * Find Payment by External Reference
   *
   * Used by recovery to find a specific payment for manual recovery.
   */
  async findByExternalReference(
    externalReference: string,
  ): Promise<RecoveryCandidate | null> {
    const payment = await prisma.payment.findUnique({
      where: { externalReference },
    });

    if (!payment) {
      return null;
    }

    return PaymentMapper.toRecoveryCandidate(payment);
  },
} as const;
