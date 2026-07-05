// ============================================================
// PAYMENT RECOVERY SERVICE
// Phase 5 Step 8: Core Recovery Engine
//
// Philosophy:
// - Core Recovery Engine that synchronizes payment status with gateway
// - Recovery NEVER changes business rules
// - One Payment → One Confirmation Flow
// - Gateway is Source of Truth
//
// Flow:
// 1. Find recovery candidates
// 2. For each candidate:
//    a. Query gateway for status
//    b. Call PaymentConfirmationService.synchronizeStatus()
// 3. Return aggregated results
//
// [v2] Key Improvements:
// - Uses synchronizeStatus() instead of calling confirm/fail directly
// - Manual recovery reuses recoverPayment() to avoid duplication
// - Explicit RecoveryOutcome enum prevents misclassification
// ============================================================

import type { PaymentGateway } from '../gateways/gateway.interface.js';
import { PaymentConfirmationService } from '../payment-confirmation.service.js';
import { PaymentRepository } from '../payment.repository.js';
import { PaymentRecoveryRepository } from './payment-recovery.repository.js';
import { RecoveryRules } from './payment-recovery.rules.js';
import {
  PaymentConfirmationSource,
  RecoveryOutcome,
  type RecoveryCandidate,
  type RecoveryConfig,
  type RecoveryResult,
  type ManualRecoveryRequest,
  type ManualRecoveryResult,
} from './payment-recovery.types.js';
import { PaymentMapper } from '../payment.mapper.js';

/**
 * Payment Recovery Service
 *
 * Core Recovery Engine that synchronizes payment status with gateway.
 *
 * INVARIANTS:
 * 1. Recovery NEVER changes business rules
 * 2. One Payment → One Confirmation Flow
 * 3. Gateway is Source of Truth
 * 4. Recovery doesn't know business logic (uses synchronizeStatus)
 */
export class PaymentRecoveryService {
  constructor(
    private readonly gateway: PaymentGateway,
    private readonly confirmationService: PaymentConfirmationService,
    private readonly recoveryRepository: typeof PaymentRecoveryRepository,
    private readonly config: RecoveryConfig = RecoveryRules.DEFAULT,
  ) {}

  /**
   * Run Recovery Batch
   *
   * Called by scheduler or manually.
   *
   * @param batchSize - Number of payments to process
   * @returns Recovery results
   */
  async runRecoveryBatch(batchSize?: number): Promise<RecoveryResult[]> {
    const size = batchSize ?? this.config.batchSize;

    // Step 1: Find candidates
    const candidates = await this.recoveryRepository.findRecoveryCandidates({
      limit: size,
      windowHours: this.config.recoveryWindowHours,
    });

    // Step 2: Process each candidate
    const results: RecoveryResult[] = [];

    for (const candidate of candidates) {
      try {
        const result = await this.recoverPayment(
          candidate,
          PaymentConfirmationSource.RECOVERY,
        );
        results.push(result);
      } catch (error) {
        // Log error but continue with next candidate
        console.error({
          event: 'RECOVERY_PAYMENT_FAILED',
          paymentId: candidate.paymentId,
          error: error instanceof Error ? error.message : String(error),
        });

        results.push({
          paymentId: candidate.paymentId,
          orderId: candidate.orderId,
          outcome: RecoveryOutcome.FAILED,
          previousStatus: candidate.status,
          newStatus: candidate.status,
          source: PaymentConfirmationSource.RECOVERY,
        });
      }
    }

    return results;
  }

  /**
   * Recover Single Payment
   *
   * [v2] This is the single entry point for all recovery types.
   * Recovery just coordinates; ConfirmationService handles business logic.
   *
   * @param candidate - Payment to recover
   * @param source - Source of recovery
   * @returns Recovery result
   */
  private async recoverPayment(
    candidate: RecoveryCandidate,
    source: PaymentConfirmationSource,
  ): Promise<RecoveryResult> {
    // Step 1: Get status from gateway
    const gatewayStatus = await this.gateway.getTransactionStatus(
      candidate.externalReference,
    );

    // Step 2: Call synchronizeStatus - let ConfirmationService handle the logic
    // [v2] Recovery doesn't need to know about confirm/fail distinction
    const syncResult = await this.confirmationService.synchronizeStatus({
      gatewayTransactionId: gatewayStatus.transactionId,
      orderId: candidate.orderId,
      gatewayStatus: gatewayStatus.status,
      amount: gatewayStatus.amount,
      source,
    });

    // Step 3: Determine outcome based on whether status changed
    const outcome: RecoveryOutcome = syncResult.changed
      ? RecoveryOutcome.CHANGED
      : RecoveryOutcome.UNCHANGED;

    return {
      paymentId: candidate.paymentId,
      orderId: candidate.orderId,
      outcome,
      previousStatus: syncResult.previousStatus,
      newStatus: syncResult.newStatus,
      source,
    };
  }

  /**
   * [v2] Manual Recovery
   *
   * Triggered by CS or Admin.
   * Reuses recoverPayment() to avoid code duplication.
   *
   * @param request - Manual recovery request
   * @returns Manual recovery result
   */
  async manualRecovery(
    request: ManualRecoveryRequest,
  ): Promise<ManualRecoveryResult> {
    // Find payment
    const payment = await PaymentRepository.findById(request.paymentId);

    if (!payment) {
      return {
        success: false,
        paymentId: request.paymentId,
        previousStatus: 'N/A',
        newStatus: 'N/A',
        message: 'Payment not found',
      };
    }

    // Only allow recovery for PENDING payments
    if (payment.status !== 'PENDING') {
      return {
        success: false,
        paymentId: request.paymentId,
        previousStatus: payment.status,
        newStatus: payment.status,
        message: `Payment is already ${payment.status}, no recovery needed`,
      };
    }

    // Check if payment has externalReference
    if (!payment.externalReference) {
      return {
        success: false,
        paymentId: request.paymentId,
        previousStatus: payment.status,
        newStatus: payment.status,
        message: 'Payment has no external reference, cannot recover',
      };
    }

    // Convert payment to recovery candidate
    const candidate = PaymentMapper.toRecoveryCandidate(payment);

    // Run recovery using the same logic as scheduled recovery
    const result = await this.recoverPayment(
      candidate,
      PaymentConfirmationSource.MANUAL,
    );

    // Map to manual result
    return {
      success: result.outcome !== RecoveryOutcome.FAILED,
      paymentId: result.paymentId,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      message:
        result.outcome === RecoveryOutcome.CHANGED
          ? `Status updated from ${result.previousStatus} to ${result.newStatus}`
          : result.outcome === RecoveryOutcome.UNCHANGED
            ? 'Status unchanged (still pending at gateway)'
            : 'Recovery failed: check logs',
    };
  }
}
