// ============================================================
// PAYMENT RECOVERY TYPES
// Phase 5 Step 8: Recovery Engine Foundation
//
// Philosophy:
// - Recovery Candidate Selection: Only PENDING payments with snapToken
// - Recovery Window: 24 hours max
// - Batch Processing: 100 payments per batch
// - Source Tracking: WEBHOOK, RECOVERY, MANUAL
// ============================================================

import type { ProviderType } from '../../../shared/config/gateway.config.js';

// ----- Payment Confirmation Source -----

/**
 * Payment Confirmation Source
 * Tracks the origin of confirmation for audit purposes.
 *
 * This allows Timeline to show HOW a payment was confirmed:
 * - WEBHOOK: Automatic via gateway webhook
 * - RECOVERY: Automatic via scheduled recovery job
 * - MANUAL: Manual trigger by CS or Admin
 */
export enum PaymentConfirmationSource {
  WEBHOOK = 'WEBHOOK',
  RECOVERY = 'RECOVERY',
  MANUAL = 'MANUAL',
}

// ----- Recovery Outcome -----

/**
 * Recovery Outcome
 * [v2] Explicit outcome to avoid misclassification in scheduler.
 *
 * Previously: Scheduler had to infer failure from changed=false
 * Now: Explicit enum makes classification unambiguous
 */
export enum RecoveryOutcome {
  CHANGED = 'CHANGED', // Status berhasil disinkronkan
  UNCHANGED = 'UNCHANGED', // Status sama dengan sebelumnya
  FAILED = 'FAILED', // Recovery gagal karena error
}

// ----- Recovery Candidate -----

/**
 * Recovery Candidate
 * A payment that is eligible for status recovery.
 *
 * Criteria:
 * 1. status = PENDING
 * 2. provider = MIDTRANS (or other active providers)
 * 3. snapToken IS NOT NULL (payment was initiated)
 * 4. createdAt > (now - recoveryWindowHours)
 */
export interface RecoveryCandidate {
  readonly paymentId: number;
  readonly orderId: number;
  readonly externalReference: string;
  readonly provider: ProviderType;
  readonly snapToken: string | null; // Must have token - payment was initiated
  readonly status: 'PENDING'; // Only PENDING payments
  readonly createdAt: Date;
}

// ----- Recovery Result -----

/**
 * Recovery Result
 * Outcome of a recovery attempt.
 */
export interface RecoveryResult {
  readonly paymentId: number;
  readonly orderId: number;
  readonly outcome: RecoveryOutcome;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly source: PaymentConfirmationSource;
}

// ----- Recovery Job Configuration -----

/**
 * Recovery Job Configuration
 */
export interface RecoveryConfig {
  readonly batchSize: number; // Max payments per batch
  readonly recoveryWindowHours: number; // Max age for PENDING payments
  readonly maxRetries: number; // Max retry attempts per payment
  readonly retryDelayMs: number; // Delay between retries
}

// ----- Recovery Job Status -----

/**
 * Recovery Job Status
 */
export enum RecoveryJobStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ----- Recovery Job Result -----

/**
 * Recovery Job Result
 * Aggregated result of a recovery job run.
 */
export interface RecoveryJobResult {
  readonly jobId: string;
  readonly status: RecoveryJobStatus;
  readonly totalCandidates: number;
  readonly processed: number;
  readonly changed: number;
  readonly unchanged: number;
  readonly failed: number;
  readonly duration: number; // ms
  readonly errors: RecoveryError[];
}

// ----- Recovery Error -----

/**
 * Recovery Error
 * Details of a failed recovery attempt.
 */
export interface RecoveryError {
  readonly paymentId: number;
  readonly externalReference: string;
  readonly error: string;
  readonly timestamp: Date;
}

// ----- Manual Recovery -----

/**
 * Manual Recovery Request
 * Request to manually trigger recovery for a specific payment.
 */
export interface ManualRecoveryRequest {
  readonly paymentId: number;
  readonly initiatedBy: string; // CS agent ID or admin ID
  readonly reason: string; // Reason for manual recovery
}

/**
 * Manual Recovery Result
 */
export interface ManualRecoveryResult {
  readonly success: boolean;
  readonly paymentId: number;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly message: string;
}

// ----- Recovery Batch -----

/**
 * Recovery Batch
 * A batch of recovery candidates for processing.
 */
export interface RecoveryBatch {
  readonly candidates: RecoveryCandidate[];
  readonly batchNumber: number;
  readonly totalBatches: number;
}
