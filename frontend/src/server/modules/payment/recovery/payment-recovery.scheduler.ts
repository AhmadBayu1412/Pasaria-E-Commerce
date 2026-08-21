// ============================================================
// PAYMENT RECOVERY SCHEDULER
// Phase 5 Step 8: Batch Orchestrator
//
// Philosophy:
// - Orchestrates batch processing of recovery jobs
// - Focus on orchestration only
// - Statistics calculation moved to aggregateResults()
//
// Features:
// - Batch processing with configurable batch size
// - Rate limiting compliance
// - Error isolation (one failure doesn't break batch)
// - Job logging for observability
//
// [v2] Key Improvements:
// - Scheduler focuses on orchestration only
// - Statistics calculation extracted to aggregateResults()
// ============================================================

import { PaymentRecoveryService } from './payment-recovery.service';
import { PaymentRecoveryRepository } from './payment-recovery.repository';
import { RecoveryRules } from './payment-recovery.rules';
import {
  RecoveryOutcome,
  RecoveryJobStatus,
  type RecoveryJobResult,
} from './payment-recovery.types';

/**
 * Payment Recovery Scheduler
 *
 * Orchestrates batch processing of recovery jobs.
 *
 * Features:
 * - Batch processing with configurable batch size
 * - Rate limiting compliance
 * - Error isolation (one failure doesn't break batch)
 * - Job logging for observability
 */
export class PaymentRecoveryScheduler {
  private readonly service: PaymentRecoveryService;
  private readonly repository: typeof PaymentRecoveryRepository;
  private readonly rules: typeof RecoveryRules;

  constructor(
    service: PaymentRecoveryService,
    repository: typeof PaymentRecoveryRepository = PaymentRecoveryRepository,
    rules: typeof RecoveryRules = RecoveryRules,
  ) {
    this.service = service;
    this.repository = repository;
    this.rules = rules;
  }

  /**
   * Run Scheduled Recovery Job
   *
   * Called by cron/scheduler.
   *
   * Flow:
   * 1. Count candidates
   * 2. If zero, log and return
   * 3. Calculate batches
   * 4. Process each batch
   * 5. Aggregate results
   */
  async runScheduledJob(): Promise<RecoveryJobResult> {
    const startTime = Date.now();
    const jobId = `recovery-${Date.now()}`;

    console.log({
      event: 'RECOVERY_JOB_STARTED',
      jobId,
      timestamp: new Date().toISOString(),
    });

    // Count total candidates
    const totalCandidates = await this.repository.countRecoveryCandidates(
      this.rules.DEFAULT.recoveryWindowHours,
    );

    if (totalCandidates === 0) {
      console.log({
        event: 'RECOVERY_JOB_SKIPPED',
        jobId,
        reason: 'NO_CANDIDATES',
        timestamp: new Date().toISOString(),
      });

      return {
        jobId,
        status: RecoveryJobStatus.COMPLETED,
        totalCandidates: 0,
        processed: 0,
        changed: 0,
        unchanged: 0,
        failed: 0,
        duration: Date.now() - startTime,
        errors: [],
      };
    }

    // Calculate batches
    const batchSize = this.rules.DEFAULT.batchSize;
    const totalBatches = Math.ceil(totalCandidates / batchSize);

    // Process batches and collect results
    const allResults = [];
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      console.log({
        event: 'RECOVERY_BATCH_STARTED',
        jobId,
        batchNumber: batchNum + 1,
        totalBatches,
        timestamp: new Date().toISOString(),
      });

      const batchResults = await this.service.runRecoveryBatch(batchSize);
      allResults.push(...batchResults);

      console.log({
        event: 'RECOVERY_BATCH_COMPLETED',
        jobId,
        batchNumber: batchNum + 1,
        timestamp: new Date().toISOString(),
      });

      // Respect rate limits - delay between batches
      if (batchNum < totalBatches - 1) {
        await this.delay(this.rules.INTER_BATCH_DELAY_MS);
      }
    }

    // [v2] Aggregate results - scheduler doesn't calculate stats
    const aggregated = this.aggregateResults(jobId, allResults, startTime);

    console.log({
      event: 'RECOVERY_JOB_COMPLETED',
      ...aggregated,
      timestamp: new Date().toISOString(),
    });

    return aggregated;
  }

  /**
   * [v2] Aggregate batch results into job result
   *
   * Separation of concerns: Scheduler orchestrates,
   * aggregation is a pure function.
   */
  private aggregateResults(
    jobId: string,
    results: Array<{
      paymentId: number;
      outcome: RecoveryOutcome;
      previousStatus: string;
      newStatus: string;
      source: string;
    }>,
    startTime: number,
  ): RecoveryJobResult {
    let changed = 0;
    let unchanged = 0;
    let failed = 0;
    const errors: Array<{
      paymentId: number;
      externalReference: string;
      error: string;
      timestamp: Date;
    }> = [];

    for (const result of results) {
      switch (result.outcome) {
        case RecoveryOutcome.CHANGED:
          changed++;
          break;
        case RecoveryOutcome.UNCHANGED:
          unchanged++;
          break;
        case RecoveryOutcome.FAILED:
          failed++;
          errors.push({
            paymentId: result.paymentId,
            externalReference: '',
            error: 'Recovery failed',
            timestamp: new Date(),
          });
          break;
      }
    }

    return {
      jobId,
      status: RecoveryJobStatus.COMPLETED,
      totalCandidates: results.length,
      processed: results.length,
      changed,
      unchanged,
      failed,
      duration: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
