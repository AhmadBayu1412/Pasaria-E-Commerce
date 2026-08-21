// ============================================================
// PAYMENT CONFIRMATION SERVICE
// Phase 5 Step 6: Business Logic
// Phase 5 Step 8: Extended with synchronizeStatus() and source tracking
//
// Philosophy:
// - Pure business logic, no transport concerns
// - Finds Payment by gatewayTransactionId (not orderId)
// - Can be called from webhook, polling, or manual trigger
// - Uses repository pattern for testability
// - Atomic transaction ensures consistency
//
// CRITICAL INVARIANTS:
// 1. "One Gateway Event → One State Transition"
// 2. Payment SUCCESS can only transition Order to PAID once per transactionId
// 3. Terminal states (SUCCESS, FAILED, CANCELLED) cannot transition to PENDING
// ============================================================

import { prisma } from '../../infra/db/prisma.js';
import { PaymentRepository } from './payment.repository.js';
import { BusinessError } from '../../shared/errors/business.error.js';
import type { PaymentStatus } from './payment.types.js';
import { PaymentConfirmationSource } from './recovery/payment-recovery.types.js';

// ============================================================
// INVARIANTS (Documented for Code Review)
// ============================================================

/**
 * INVARIANT 1: One Gateway Transaction → One Payment Confirmation
 *
 * Each gatewayTransactionId can only trigger ONE successful confirmation.
 * Duplicate events are idempotently handled (return same result).
 */
const INVARIANT_ONE_CONFIRMATION = 'One Gateway Transaction confirms exactly one Payment';

/**
 * INVARIANT 2: Terminal States are Immutable
 *
 * SUCCESS, FAILED, CANCELLED, EXPIRED, DECLINED cannot transition to PENDING.
 * This prevents race conditions where a failed payment "comes back to life."
 */
const INVARIANT_TERMINAL_IMMUTABLE = 'Terminal payment states are immutable';

/**
 * INVARIANT 3: Amount Validation Before State Change
 *
 * Gateway amount must match stored payment amount to prevent fraud.
 */
const INVARIANT_AMOUNT_MATCH = 'Gateway amount must match stored payment amount';

/**
 * INVARIANT 4: Order State Follows Payment State
 *
 * When Payment → SUCCESS, Order → PAID
 * When Payment → FAILED/CANCELLED, Order → CANCELLED
 * This is enforced atomically in one transaction.
 */
const INVARIANT_ORDER_SYNC = 'Order state is synchronized with Payment state atomically';

// ============================================================
// INPUT/OUTPUT TYPES
// ============================================================

export interface ConfirmPaymentInput {
  readonly gatewayTransactionId: string; // PRIMARY KEY — unique per transaction
  readonly orderId: number;
  readonly eventType: string;
  readonly amount: number;
  readonly source: PaymentConfirmationSource; // Phase 5 Step 8: Track source
}

export interface ConfirmPaymentResult {
  readonly paymentId: number;
  readonly orderId: number;
  readonly previousPaymentStatus: PaymentStatus;
  readonly newPaymentStatus: PaymentStatus;
  readonly idempotent: boolean; // true if this was a duplicate request
  readonly source: PaymentConfirmationSource; // Phase 5 Step 8: Track source
}

/**
 * Synchronize Status Input
 * Phase 5 Step 8: For Recovery Engine
 *
 * Recovery cukup panggil satu method ini, tidak perlu pilih confirm/fail sendiri.
 */
export interface SynchronizeStatusInput {
  readonly gatewayTransactionId: string;
  readonly orderId: number;
  readonly gatewayStatus: string; // 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED'
  readonly amount: number;
  readonly source: PaymentConfirmationSource;
}

/**
 * Synchronize Status Result
 * Phase 5 Step 8: For Recovery Engine
 */
export interface SynchronizeStatusResult {
  readonly paymentId: number;
  readonly orderId: number;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly changed: boolean;
  readonly source: PaymentConfirmationSource;
}

// ============================================================
// STATE MACHINE (Documented)
// ============================================================

/**
 * PAYMENT STATE TRANSITIONS
 *
 * Valid transitions:
 * - PENDING → SUCCESS (via PAYMENT_SETTLEMENT, PAYMENT_SUCCESS)
 * - PENDING → FAILED (via PAYMENT_DENY, PAYMENT_FAILURE)
 * - PENDING → CANCELLED (via PAYMENT_EXPIRE, PAYMENT_CANCEL)
 * - PENDING → DECLINED (via PAYMENT_DENY)
 * - PENDING → EXPIRED (via PAYMENT_EXPIRE)
 *
 * Terminal states (no outbound transitions):
 * - SUCCESS
 * - FAILED
 * - CANCELLED
 * - EXPIRED
 * - DECLINED
 */
const SUCCESS_EVENTS = ['PAYMENT_SETTLEMENT', 'PAYMENT_SUCCESS'];
const FAILURE_EVENTS = ['PAYMENT_DENY', 'PAYMENT_FAILURE', 'PAYMENT_EXPIRE', 'PAYMENT_CANCEL'];
const TERMINAL_STATUSES: PaymentStatus[] = ['SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'DECLINED'];

/**
 * Gateway Status to Payment Status mapping
 * Phase 5 Step 8: For Recovery Engine
 */
const GATEWAY_TO_PAYMENT_STATUS: Record<string, PaymentStatus> = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  PENDING: 'PENDING',
};

/**
 * Gateway Status to Event Type mapping
 * Phase 5 Step 8: For Recovery Engine
 */
const GATEWAY_TO_EVENT_TYPE: Record<string, string> = {
  PENDING: 'PAYMENT_PENDING',
  SUCCESS: 'PAYMENT_SETTLEMENT',
  FAILED: 'PAYMENT_FAILURE',
  EXPIRED: 'PAYMENT_EXPIRE',
  CANCELLED: 'PAYMENT_CANCEL',
};

export class PaymentConfirmationService {
  /**
   * Confirm payment from webhook event
   *
   * Flow:
   * 1. Find Payment by gatewayTransactionId (CRITICAL: not orderId)
   * 2. Validate amount matches (INVARIANT_AMOUNT_MATCH)
   * 3. Check if already in terminal state (INVARIANT_TERMINAL_IMMUTABLE)
   * 4. Execute atomic transaction:
   *    - Update Payment to SUCCESS
   *    - Update Order to PAID
   *    - Create Timeline entry
   *
   * WHY gatewayTransactionId as key?
   * - One order can have multiple payment attempts (retry)
   * - Each attempt has unique gatewayTransactionId
   * - orderId alone is ambiguous
   *
   * @throws BusinessError with code 'PAYMENT_NOT_FOUND' if payment doesn't exist
   * @throws BusinessError with code 'AMOUNT_MISMATCH' if amounts don't match
   * @throws BusinessError with code 'INVALID_STATE_TRANSITION' if payment is in terminal state
   */
  async confirmPayment(
    input: ConfirmPaymentInput,
  ): Promise<ConfirmPaymentResult> {
    // Step 1: Find payment by gatewayTransactionId
    // We need to find the SPECIFIC payment for this transaction
    let payment = await PaymentRepository.findByTransactionId(input.gatewayTransactionId);

    // Fallback: If gatewayTransactionId not stored, find by orderId + PENDING
    // This handles early payments before gatewayTransactionId was added
    //
    // TODO Phase 6 (Migration only):
    // Remove this fallback after all payments have gatewayTransactionId stored.
    // This is a migration path, not a permanent solution.
    payment =
      payment ??
      (await PaymentRepository.findPendingByOrderId(input.orderId));

    if (!payment) {
      throw new BusinessError(
        `Payment not found for transaction ${input.gatewayTransactionId}`,
        404,
        'PAYMENT_NOT_FOUND',
      );
    }

    // Step 2: Validate amount (INVARIANT_AMOUNT_MATCH)
    if (payment.amount !== input.amount) {
      throw new BusinessError(
        `Amount mismatch: expected ${payment.amount}, got ${input.amount}`,
        400,
        'AMOUNT_MISMATCH',
      );
    }

    // Step 3: Check if already in terminal state (INVARIANT_TERMINAL_IMMUTABLE)
    if (TERMINAL_STATUSES.includes(payment.status)) {
      // Idempotent response - already confirmed
      return {
        paymentId: payment.id,
        orderId: payment.orderId,
        previousPaymentStatus: payment.status,
        newPaymentStatus: payment.status,
        idempotent: true,
        source: input.source,
      };
    }

    // Step 4: Validate event type is a success event
    if (!SUCCESS_EVENTS.includes(input.eventType)) {
      throw new BusinessError(
        `Event type ${input.eventType} does not confirm payment`,
        400,
        'INVALID_EVENT_TYPE',
      );
    }

    // Step 5: Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update Payment to SUCCESS
      const updatedPayment = await tx.payment.update({
        where: { id: payment!.id },
        data: {
          status: 'SUCCESS',
          gatewayTransactionId: input.gatewayTransactionId, // Store for future lookups
        },
      });

      // Update Order to PAID (INVARIANT_ORDER_SYNC)
      await tx.order.update({
        where: { id: payment!.orderId },
        data: { status: 'PAID' },
      });

      // Create Timeline entry for audit trail
      await tx.orderTimeline.create({
        data: {
          orderId: payment!.orderId,
          event: 'PAYMENT_CONFIRMED',
          metadata: JSON.stringify({
            paymentId: payment!.id,
            gatewayTransactionId: input.gatewayTransactionId,
            eventType: input.eventType,
            previousStatus: payment!.status,
            newStatus: 'SUCCESS',
            confirmedAt: new Date().toISOString(),
            source: input.source,
          }),
        },
      });

      return {
        paymentId: updatedPayment.id,
        orderId: payment!.orderId,
        previousPaymentStatus: payment!.status as PaymentStatus,
        newPaymentStatus: 'SUCCESS' as PaymentStatus,
        idempotent: false,
      };
    });

    return {
      ...result,
      source: input.source,
    };
  }

  /**
   * Fail payment from webhook event
   *
   * Flow:
   * 1. Find Payment by gatewayTransactionId
   * 2. Check if already in terminal state (idempotent)
   * 3. Validate event type is failure
   * 4. Atomic transaction: Payment → FAILED, Order → CANCELLED
   */
  async failPayment(
    gatewayTransactionId: string,
    reason: string,
    source: PaymentConfirmationSource,
  ): Promise<ConfirmPaymentResult | null> {
    const payment = await PaymentRepository.findByTransactionId(gatewayTransactionId);

    if (!payment) {
      return null; // Payment not found, skip
    }

    // Idempotent: already in terminal state
    if (TERMINAL_STATUSES.includes(payment.status)) {
      return {
        paymentId: payment.id,
        orderId: payment.orderId,
        previousPaymentStatus: payment.status,
        newPaymentStatus: payment.status,
        idempotent: true,
        source,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'CANCELLED' },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: payment.orderId,
          event: 'PAYMENT_FAILED',
          metadata: JSON.stringify({
            paymentId: payment.id,
            gatewayTransactionId,
            reason,
            failedAt: new Date().toISOString(),
            source,
          }),
        },
      });
    });

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      previousPaymentStatus: payment.status,
      newPaymentStatus: 'FAILED',
      idempotent: false,
      source,
    };
  }

  /**
   * Synchronize Status from Recovery
   * Phase 5 Step 8: For Recovery Engine
   *
   * Recovery cukup panggil method ini.
   * ConfirmationService yang menentukan logika transisi.
   *
   * Flow:
   * 1. Map gateway status to event type
   * 2. Call appropriate method (confirm/fail)
   * 3. Return unified result
   */
  async synchronizeStatus(
    input: SynchronizeStatusInput,
  ): Promise<SynchronizeStatusResult> {
    // Map gateway status to payment status
    const newPaymentStatus = this.gatewayStatusToPaymentStatus(input.gatewayStatus);

    // Handle based on status
    if (newPaymentStatus === 'SUCCESS') {
      const eventType = this.gatewayStatusToEventType(input.gatewayStatus);

      const result = await this.confirmPayment({
        gatewayTransactionId: input.gatewayTransactionId,
        orderId: input.orderId,
        eventType,
        amount: input.amount,
        source: input.source,
      });

      return {
        paymentId: result.paymentId,
        orderId: result.orderId,
        previousStatus: result.previousPaymentStatus,
        newStatus: result.newPaymentStatus,
        changed: !result.idempotent,
        source: input.source,
      };
    } else {
      // FAILED, EXPIRED, CANCELLED
      const result = await this.failPayment(
        input.gatewayTransactionId,
        `Payment ${newPaymentStatus.toLowerCase()} via ${input.source.toLowerCase()}`,
        input.source,
      );

      if (!result) {
        // Payment not found - this shouldn't happen in recovery
        return {
          paymentId: 0,
          orderId: input.orderId,
          previousStatus: 'UNKNOWN',
          newStatus: newPaymentStatus,
          changed: false,
          source: input.source,
        };
      }

      return {
        paymentId: result.paymentId,
        orderId: result.orderId,
        previousStatus: result.previousPaymentStatus,
        newStatus: result.newPaymentStatus,
        changed: !result.idempotent,
        source: input.source,
      };
    }
  }

  /**
   * Map gateway status to payment status
   * Phase 5 Step 8: For Recovery Engine
   */
  private gatewayStatusToPaymentStatus(gatewayStatus: string): PaymentStatus {
    return GATEWAY_TO_PAYMENT_STATUS[gatewayStatus] ?? 'PENDING';
  }

  /**
   * Map gateway status to event type
   * Phase 5 Step 8: For Recovery Engine
   */
  private gatewayStatusToEventType(status: string): string {
    return GATEWAY_TO_EVENT_TYPE[status] ?? 'PAYMENT_PENDING';
  }
}
