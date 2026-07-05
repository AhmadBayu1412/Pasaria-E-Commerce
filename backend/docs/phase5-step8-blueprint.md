# Phase 5 — Step 8 Blueprint

# Payment Recovery & Status Synchronization

---

# 📋 Overview

| Field       | Value                                         |
| ----------- | --------------------------------------------- |
| **Step**    | Step 8                                        |
| **Phase**   | Phase 5 — Payment Gateway Integration         |
| **Title**   | Payment Recovery & Status Synchronization     |
| **Status**  | Blueprint (v2 - Revised)                      |
| **Created** | 2026-07-05                                    |
| **Revised** | 2026-07-05 (based on Senior Architect Review) |

---

# 🎯 Objective

Build a **Recovery Engine** that ensures payment status remains synchronized with the payment gateway, even when webhooks fail, are delayed, or are never received.

---

# 🔍 Problem Statement

## Current Architecture

```text
User
  │
  ▼
PaymentHandler
  │
  ▼
GatewayChargeService
  │
  ▼
Midtrans
  │
  ▼
Webhook
  │
  ▼
PaymentConfirmationService
```

**Problem 1: Webhook Failure**

```
Midtrans
  │
  ▼
POST /webhook
  │
  ▼
Network Timeout
  │
  ▼
All Retries Fail
```

**Result**: Midtrans = SUCCESS, Pasaria = PENDING

**Problem 2: Confirmation Failure**

```
Webhook
  │
  ▼
PaymentConfirmationService
  │
  ▼
Exception
  │
  ▼
Rollback
```

**Result**: Gateway = Done, Pasaria = PENDING

**Problem 3: CS Manual Refresh**
User calls CS: "I already paid" but dashboard shows "WAITING PAYMENT"

---

# 💡 Core Concept

## Recovery Pattern

```
Observe → Recover → Synchronize
```

**NOT** "Receive Event" anymore.

## Recovery is NOT Polling

Polling is just one input. Tomorrow could be:

- Manual Refresh
- Admin Sync
- Scheduled Job
- CLI Recovery

All use the same Recovery Engine.

---

# 🏗️ Architecture

## New Architecture

```text
Scheduler
    │
    ▼
PaymentRecoveryService
    │
    ▼
PaymentGateway.getTransactionStatus()
    │
    ▼
Gateway Adapter
    │
    ▼
Normalized Payment Status
    │
    ▼
PaymentConfirmationService
    │
    ▼
Database Transaction
    ├── Payment
    ├── Order
    └── Timeline
    │
    ▼
Complete
```

## Key Insight

Both **Webhook** and **Recovery** produce:

```
Payment Status Changed
```

What changes is the **Source**:

- WEBHOOK
- RECOVERY
- MANUAL

But the **business process remains the same**.

---

# 📁 File Layout

```text
modules/payment/
│
├── recovery/
│   ├── payment-recovery.service.ts    # Core recovery engine
│   ├── payment-recovery.scheduler.ts  # Batch scheduler
│   ├── payment-recovery.repository.ts # Recovery candidate queries
│   ├── payment-recovery.types.ts      # Type definitions
│   ├── payment-recovery.errors.ts      # Error types
│   └── payment-recovery.rules.ts       # Recovery configuration
│
├── payment-confirmation.service.ts    # [EXISTING - EXTENDED]
├── payment-confirmation.types.ts      # [NEW - Extract types]
└── ...
```

**Naming Rationale**: Using `recovery/` folder instead of `polling/` because the engine handles:

- Scheduled recovery
- Manual refresh
- CLI recovery
- Admin sync

---

# 🔌 Interface Blueprint

## 1. PaymentGateway Extension

### gateway.interface.ts (MODIFY)

```typescript
import type {
  CreateChargeRequest,
  CreateChargeResult,
} from './gateway.types.js';

export interface PaymentGateway {
  /**
   * Create Charge
   * [EXISTING]
   */
  createCharge(request: CreateChargeRequest): Promise<CreateChargeResult>;

  /**
   * Get Transaction Status from Provider
   * [NEW - Step 8]
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
```

### gateway.types.ts (ADD)

```typescript
/**
 * Recovery Candidate
 * A payment that is eligible for status recovery.
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

/**
 * Recovery Batch
 * A batch of recovery candidates for processing.
 */
export interface RecoveryBatch {
  readonly candidates: RecoveryCandidate[];
  readonly batchNumber: number;
  readonly totalBatches: number;
}
```

---

## 2. Recovery Types

### payment-recovery.types.ts (NEW)

```typescript
/**
 * Payment Confirmation Source
 * Tracks the origin of confirmation for audit purposes.
 */
export enum PaymentConfirmationSource {
  WEBHOOK = 'WEBHOOK',
  RECOVERY = 'RECOVERY',
  MANUAL = 'MANUAL',
}

/**
 * Recovery Job Configuration
 */
export interface RecoveryConfig {
  readonly batchSize: number; // Max payments per batch
  readonly recoveryWindowHours: number; // Max age for PENDING payments
  readonly maxRetries: number; // Max retry attempts per payment
  readonly retryDelayMs: number; // Delay between retries
}

/**
 * Recovery Job Status
 */
export enum RecoveryJobStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Recovery Job Result
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
```

---

## 3. PaymentConfirmationService Extension

### payment-confirmation.types.ts (NEW FILE)

```typescript
import { PaymentConfirmationSource } from '../recovery/payment-recovery.types.js';

export interface ConfirmPaymentInput {
  readonly gatewayTransactionId: string;
  readonly orderId: number;
  readonly eventType: string;
  readonly amount: number;
  readonly source: PaymentConfirmationSource; // [NEW]
}

export interface ConfirmPaymentResult {
  readonly paymentId: number;
  readonly orderId: number;
  readonly previousPaymentStatus: string;
  readonly newPaymentStatus: string;
  readonly idempotent: boolean;
  readonly source: PaymentConfirmationSource; // [NEW]
}

/**
 * [v2] Synchronize Status Input
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
 * [v2] Synchronize Status Result
 */
export interface SynchronizeStatusResult {
  readonly paymentId: number;
  readonly orderId: number;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly changed: boolean;
  readonly source: PaymentConfirmationSource;
}
```

### payment-confirmation.service.ts (MODIFY)

```typescript
// [v2] ADD: synchronizeStatus() method
// [v2] ADD: Source parameter to existing methods

async confirmPayment(
  input: ConfirmPaymentInput,
): Promise<ConfirmPaymentResult> {
  // ... existing logic ...

  // Create Timeline entry with source
  await tx.orderTimeline.create({
    data: {
      orderId: payment!.orderId,
      event: 'PAYMENT_CONFIRMED',
      metadata: {
        paymentId: payment!.id,
        gatewayTransactionId: input.gatewayTransactionId,
        eventType: input.eventType,
        previousStatus: payment!.status,
        newStatus: 'SUCCESS',
        confirmedAt: new Date().toISOString(),
        source: input.source,
      },
    },
  });
}

async failPayment(
  gatewayTransactionId: string,
  reason: string,
  source: PaymentConfirmationSource,
): Promise<ConfirmPaymentResult | null> {
  // ... existing logic with source in metadata
}

/**
 * [v2] Synchronize Status from Recovery
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
  // Map gateway status to event type
  const eventType = this.gatewayStatusToEventType(input.gatewayStatus);

  // Determine new payment status
  const newStatus = this.gatewayStatusToPaymentStatus(input.gatewayStatus);

  // Handle based on status
  if (newStatus === 'SUCCESS') {
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
      `Payment ${newStatus.toLowerCase()} via ${input.source.toLowerCase()}`,
      input.source,
    );

    if (!result) {
      // Payment not found - this shouldn't happen in recovery
      return {
        paymentId: 0,
        orderId: input.orderId,
        previousStatus: 'UNKNOWN',
        newStatus,
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
 * [v2] Map gateway status to payment status
 */
private gatewayStatusToPaymentStatus(gatewayStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
    PENDING: 'PENDING',
  };
  return statusMap[gatewayStatus] ?? 'PENDING';
}

/**
 * [v2] Map gateway status to event type
 */
private gatewayStatusToEventType(status: string): string {
  const eventMap: Record<string, string> = {
    PENDING: 'PAYMENT_PENDING',
    SUCCESS: 'PAYMENT_SETTLEMENT',
    FAILED: 'PAYMENT_FAILURE',
    EXPIRED: 'PAYMENT_EXPIRE',
    CANCELLED: 'PAYMENT_CANCEL',
  };
  return eventMap[status] ?? 'PAYMENT_PENDING';
}
```

---

## 4. Recovery Service

### payment-recovery.service.ts (NEW)

```typescript
import { PaymentGateway } from '../gateways/gateway.interface.js';
import { PaymentConfirmationService } from '../payment-confirmation.service.js';
import { PaymentRepository } from '../payment.repository.js';
import { PaymentRecoveryRepository } from './payment-recovery.repository.js';
import { RecoveryRules } from './payment-recovery.rules.js';
import {
  PaymentConfirmationSource,
  RecoveryOutcome,
  type RecoveryConfig,
  type RecoveryResult,
  type ManualRecoveryRequest,
  type ManualRecoveryResult,
} from './payment-recovery.types.js';
import { PaymentMapper } from '../payment.mapper.js';
import type { Payment } from '../payment.types.js';

/**
 * Payment Recovery Service
 *
 * Core Recovery Engine that synchronizes payment status with gateway.
 *
 * INVARIANTS:
 * 1. Recovery NEVER changes business rules
 * 2. One Payment → One Confirmation Flow
 * 3. Gateway is Source of Truth
 *
 * Flow:
 * 1. Find recovery candidates
 * 2. For each candidate:
 *    a. Query gateway for status
 *    b. Call PaymentConfirmationService.synchronizeStatus()
 * 3. Return aggregated results
 */
export class PaymentRecoveryService {
  constructor(
    private readonly gateway: PaymentGateway,
    private readonly confirmationService: PaymentConfirmationService,
    private readonly recoveryRepository: PaymentRecoveryRepository,
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
    const syncResult = await this.confirmationService.synchronizeStatus({
      gatewayTransactionId: gatewayStatus.transactionId,
      orderId: candidate.orderId,
      gatewayStatus: gatewayStatus.status,
      amount: gatewayStatus.amount,
      source,
    });

    // Step 3: Determine outcome
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

    // Run recovery
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
            : `Recovery failed: check logs`,
    };
  }
}
```

---

## 5. Recovery Repository

### payment-recovery.repository.ts (NEW)

```typescript
import { prisma } from '../../../infra/db/prisma.js';
import { PaymentMapper } from '../payment.mapper.js';
import type { RecoveryCandidate } from './payment-recovery.types.js';

interface FindCandidatesOptions {
  readonly limit: number;
  readonly windowHours: number;
}

/**
 * Payment Recovery Repository
 *
 * Responsible for finding payments that need status recovery.
 *
 * Recovery Candidate Criteria:
 * 1. status = PENDING
 * 2. provider = MIDTRANS (or other active providers)
 * 3. snapToken IS NOT NULL (payment was initiated)
 * 4. createdAt > (now - recoveryWindowHours)
 * 5. NOT in terminal state
 */
export const PaymentRecoveryRepository = {
  /**
   * Find Recovery Candidates
   *
   * Returns payments that are eligible for status recovery.
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
} as const;
```

---

## 6. Recovery Scheduler

### payment-recovery.scheduler.ts (NEW)

```typescript
import { PaymentRecoveryService } from './payment-recovery.service.js';
import { PaymentRecoveryRepository } from './payment-recovery.repository.js';
import { RecoveryRules } from './payment-recovery.rules.js';
import {
  RecoveryOutcome,
  type RecoveryJobResult,
} from './payment-recovery.types.js';

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
 *
 * [v2] Change: Scheduler focuses on orchestration only.
 * Statistics calculation moved to aggregateResults().
 */
export class PaymentRecoveryScheduler {
  private readonly service: PaymentRecoveryService;
  private readonly repository: PaymentRecoveryRepository;
  private readonly rules: typeof RecoveryRules;

  constructor(
    service: PaymentRecoveryService,
    repository: PaymentRecoveryRepository = PaymentRecoveryRepository,
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
        status: 'COMPLETED',
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
      status: 'COMPLETED',
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
```

---

## 7. Recovery Rules

### payment-recovery.rules.ts (NEW)

```typescript
/**
 * Recovery Rules
 *
 * Configuration constants for the recovery engine.
 *
 * These values can be:
 * - Hardcoded here (for simplicity)
 * - Loaded from config/env (for flexibility)
 * - Both (with env taking precedence)
 */

// Recovery Window
// PENDING payments older than this are NOT recovered
// Reason: Provider usually expires unpaid transactions
const DEFAULT_RECOVERY_WINDOW_HOURS = 24;

// Batch Processing
// Number of payments to process per batch
const DEFAULT_BATCH_SIZE = 100;

// Rate Limiting
// Delay between batches to respect provider limits
const INTER_BATCH_DELAY_MS = 1000; // 1 second

// Retry Configuration
const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

// Scheduler
// How often to run recovery job
const SCHEDULE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const RecoveryRules = {
  DEFAULT: {
    batchSize: DEFAULT_BATCH_SIZE,
    recoveryWindowHours: DEFAULT_RECOVERY_WINDOW_HOURS,
    maxRetries: DEFAULT_MAX_RETRIES,
    retryDelayMs: RETRY_DELAY_MS,
  },

  INTER_BATCH_DELAY_MS,
  SCHEDULE_INTERVAL_MS,

  /**
   * Get rules from environment
   * Allows runtime configuration
   */
  fromEnv() {
    return {
      batchSize: parseInt(
        process.env.RECOVERY_BATCH_SIZE ?? String(DEFAULT_BATCH_SIZE),
        10,
      ),
      recoveryWindowHours: parseInt(
        process.env.RECOVERY_WINDOW_HOURS ??
          String(DEFAULT_RECOVERY_WINDOW_HOURS),
        10,
      ),
      maxRetries: parseInt(
        process.env.RECOVERY_MAX_RETRIES ?? String(DEFAULT_MAX_RETRIES),
        10,
      ),
      retryDelayMs: parseInt(
        process.env.RECOVERY_RETRY_DELAY_MS ?? String(RETRY_DELAY_MS),
        10,
      ),
    };
  },
} as const;
```

---

## 8. Recovery Errors

### payment-recovery.errors.ts (NEW)

```typescript
/**
 * Payment Recovery Errors
 *
 * Domain-specific errors for the recovery engine.
 */

export class PaymentRecoveryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly paymentId?: number,
    public readonly externalReference?: string,
  ) {
    super(message);
    this.name = 'PaymentRecoveryError';
  }
}

export class PaymentNotFoundForRecoveryError extends PaymentRecoveryError {
  constructor(externalReference: string) {
    super(
      `Payment not found for recovery: ${externalReference}`,
      'PAYMENT_NOT_FOUND_FOR_RECOVERY',
    );
    this.name = 'PaymentNotFoundForRecoveryError';
  }
}

export class PaymentNotRecoverableError extends PaymentRecoveryError {
  constructor(paymentId: number, reason: string) {
    super(
      `Payment ${paymentId} is not recoverable: ${reason}`,
      'PAYMENT_NOT_RECOVERABLE',
      paymentId,
    );
    this.name = 'PaymentNotRecoverableError';
  }
}

export class RecoveryGatewayError extends PaymentRecoveryError {
  constructor(externalReference: string, providerError: string) {
    super(
      `Gateway error during recovery for ${externalReference}: ${providerError}`,
      'RECOVERY_GATEWAY_ERROR',
    );
    this.externalReference = externalReference;
    this.name = 'RecoveryGatewayError';
  }
}

export class RecoveryRateLimitError extends PaymentRecoveryError {
  constructor(waitMs: number) {
    super(
      `Rate limit exceeded. Wait ${waitMs}ms before retry.`,
      'RECOVERY_RATE_LIMIT',
    );
    this.name = 'RecoveryRateLimitError';
  }
}
```

---

## 9. Payment Mapper Extension

### payment.mapper.ts (MODIFY)

```typescript
import type {
  Payment,
  PaymentProvider,
  PaymentStatus,
} from './payment.types.js';
import type { RecoveryCandidate } from './recovery/payment-recovery.types.js';

/**
 * Payment Mapper
 *
 * Maps between Prisma models and Domain types.
 */
export const PaymentMapper = {
  // ... existing methods ...

  /**
   * Map Prisma Payment to Recovery Candidate
   * [NEW - Step 8]
   */
  toRecoveryCandidate(prismaPayment: {
    id: number;
    orderId: number;
    externalReference: string;
    provider: PaymentProvider;
    snapToken: string | null;
    status: PaymentStatus;
    createdAt: Date;
  }): RecoveryCandidate {
    return {
      paymentId: prismaPayment.id,
      orderId: prismaPayment.orderId,
      externalReference: prismaPayment.externalReference,
      provider: prismaPayment.provider,
      snapToken: prismaPayment.snapToken,
      status: 'PENDING', // Only PENDING payments are candidates
      createdAt: prismaPayment.createdAt,
    };
  },
} as const;
```

---

## 10. Midtrans Gateway Extension

### gateways/midtrans/midtrans.gateway.ts (MODIFY)

```typescript
import type {
  PaymentGateway,
  GatewayTransactionStatus,
  GatewayStatus,
} from '../gateway.interface.js';
import type {
  CreateChargeRequest,
  CreateChargeResult,
} from '../gateway.types.js';
import { PaymentGatewayError } from '../gateway.errors.js';
import { MidtransClient } from './midtrans.client.js';
import { MidtransMapper } from './midtrans.mapper.js';
import type { MidtransTransactionStatus } from './midtrans.types.js';

export class MidtransGateway implements PaymentGateway {
  private readonly client: MidtransClient;
  private readonly mapper: MidtransMapper;

  constructor(config: {
    readonly serverKey: string;
    readonly clientKey?: string;
    readonly baseUrl: string;
    readonly isProduction?: boolean;
    readonly timeoutMs?: number;
    readonly maxRetries?: number;
  }) {
    if (!config.serverKey) {
      throw new Error('Midtrans server key is required');
    }

    this.client = new MidtransClient({
      apiKey: config.serverKey,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs ?? 10_000,
      maxRetries: config.maxRetries ?? 3,
    });

    this.mapper = new MidtransMapper();
  }

  /**
   * Create Charge via Midtrans Snap API
   */
  async createCharge(
    request: CreateChargeRequest,
  ): Promise<CreateChargeResult> {
    try {
      // Translate domain request → Midtrans format
      const providerRequest = this.mapper.toProviderRequest(request);

      // Call Midtrans API
      const providerResponse =
        await this.client.createSnapToken(providerRequest);

      // Translate response → domain result
      return this.mapper.toDomainResult(providerResponse, request);
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      throw PaymentGatewayError.providerError(
        `Midtrans charge failed: ${error}`,
        error,
      );
    }
  }

  /**
   * Get Transaction Status from Midtrans
   * [NEW - Step 8]
   *
   * Uses Midtrans Status API to get current transaction status.
   * https://docs.midtrans.com/reference/get-transaction-status
   */
  async getTransactionStatus(
    externalReference: string,
  ): Promise<GatewayTransactionStatus> {
    try {
      // Call Midtrans Status API
      const providerStatus =
        await this.client.getTransactionStatus(externalReference);

      // Map to domain status
      return this.mapTransactionStatus(providerStatus);
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      throw PaymentGatewayError.providerError(
        `Failed to get transaction status: ${error}`,
        error,
      );
    }
  }

  /**
   * Map Midtrans Status to Domain Status
   */
  private mapTransactionStatus(
    status: MidtransTransactionStatus,
  ): GatewayTransactionStatus {
    // Midtrans transaction_status values
    // https://docs.midtrans.com/reference/transaction-status
    const statusMap: Record<string, GatewayStatus> = {
      capture: 'SUCCESS', // Card payment captured
      settlement: 'SUCCESS', // Payment confirmed
      pending: 'PENDING', // Waiting for payment
      deny: 'FAILED', // Payment denied
      cancel: 'CANCELLED', // Payment cancelled
      expire: 'EXPIRED', // Payment expired
      refund: 'FAILED', // Payment refunded
    };

    return {
      transactionId: status.transaction_id,
      externalReference: status.order_id,
      status: statusMap[status.transaction_status] ?? 'PENDING',
      amount: parseInt(status.gross_amount, 10),
      currency: status.currency,
      paidAt:
        status.transaction_status === 'settlement' ||
        status.transaction_status === 'capture'
          ? new Date()
          : undefined,
      updatedAt: new Date(),
    };
  }
}
```

### gateways/midtrans/midtrans.client.ts (MODIFY)

```typescript
import type {
  MidtransSnapRequest,
  MidtransSnapResponse,
  MidtransTransactionStatus,
} from './midtrans.types.js';

export class MidtransClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: {
    apiKey: string;
    baseUrl: string;
    timeoutMs?: number;
    maxRetries?: number;
  }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  /**
   * Create Snap Token
   */
  async createSnapToken(
    request: MidtransSnapRequest,
  ): Promise<MidtransSnapResponse> {
    const url = `${this.baseUrl}/v1/tokenization`;

    const response = await this.executeRequest<MidtransSnapResponse>(
      'POST',
      url,
      request,
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Midtrans tokenization failed: ${response.status} ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Get Transaction Status
   * [NEW - Step 8]
   *
   * @param orderId - The order ID (externalReference)
   * @returns Midtrans transaction status
   */
  async getTransactionStatus(
    orderId: string,
  ): Promise<MidtransTransactionStatus> {
    const url = `${this.baseUrl}/v2/${orderId}/status`;

    const response = await this.executeRequest<MidtransTransactionStatus>(
      'GET',
      url,
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Midtrans status API error: ${response.status} ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Execute HTTP request with authentication
   */
  private async executeRequest<T>(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    return fetch(url, config);
  }
}
```

---

# ✅ Objective Audit Matrix

## Architecture Alignment

| Criterion                                  | Assessment | Evidence                                                                 |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------ |
| Recovery follows existing patterns         | **PASS**   | PaymentRecoveryService uses same `PaymentConfirmationService` as Webhook |
| PaymentConfirmationService unchanged logic | **PASS**   | Only `source` parameter added, business logic unchanged                  |
| PaymentRepository extended, not modified   | **PASS**   | `PaymentRecoveryRepository` is separate file                             |
| Gateway pattern respected                  | **PASS**   | `getTransactionStatus()` follows `createCharge()` pattern                |
| **Scheduler SRP**                          | **PASS**   | [v2] Scheduler focuses on orchestration, stats in `aggregateResults()`   |
| **Manual recovery reuses logic**           | **PASS**   | [v2] `manualRecovery()` calls `recoverPayment()`                         |
| **Explicit RecoveryOutcome**               | **PASS**   | [v2] No more ambiguous classification                                    |

## Scope Guard Adherence

| Criterion                    | Assessment | Evidence                |
| ---------------------------- | ---------- | ----------------------- |
| No Refund logic              | **PASS**   | Out of scope for Step 8 |
| No Chargeback logic          | **PASS**   | Out of scope for Step 8 |
| No Dispute logic             | **PASS**   | Out of scope for Step 8 |
| No Settlement Report         | **PASS**   | Out of scope for Step 8 |
| No Accounting Reconciliation | **PASS**   | Out of scope for Step 8 |

## Progressive Check

| Criterion                                 | Assessment | Evidence                                                |
| ----------------------------------------- | ---------- | ------------------------------------------------------- |
| Uses `getTransactionStatus()` from Step 7 | **PASS**   | `MidtransTransactionStatus` type exists in Step 7       |
| Uses existing PaymentGateway interface    | **PASS**   | Extended with new method                                |
| Uses existing PaymentConfirmationService  | **PASS**   | `synchronizeStatus()` added, original methods preserved |
| Uses existing PaymentRepository queries   | **PASS**   | Extended with new queries                               |
| Batch processing respects rate limits     | **PASS**   | `INTER_BATCH_DELAY_MS` in rules                         |

---

# 📊 Deliverables Summary

## Domain Files

| File                                      | Type       | Status |
| ----------------------------------------- | ---------- | ------ |
| `recovery/payment-recovery.types.ts`      | Types      | NEW    |
| `recovery/payment-recovery.errors.ts`     | Errors     | NEW    |
| `recovery/payment-recovery.rules.ts`      | Config     | NEW    |
| `recovery/payment-recovery.repository.ts` | Repository | NEW    |
| `recovery/payment-recovery.service.ts`    | Service    | NEW    |
| `recovery/payment-recovery.scheduler.ts`  | Scheduler  | NEW    |
| `payment-confirmation.types.ts`           | Types      | NEW    |

## Gateway Extension

| File                                    | Change                             |
| --------------------------------------- | ---------------------------------- |
| `gateways/gateway.interface.ts`         | ADD `getTransactionStatus()`       |
| `gateways/midtrans/midtrans.gateway.ts` | IMPLEMENT `getTransactionStatus()` |
| `gateways/midtrans/midtrans.client.ts`  | IMPLEMENT status API call          |

## Tests

| Test                                | Description                             |
| ----------------------------------- | --------------------------------------- |
| Payment remains PENDING             | Gateway also PENDING, outcome=UNCHANGED |
| Payment becomes SUCCESS             | Gateway SUCCESS, outcome=CHANGED        |
| Payment becomes FAILED              | Gateway FAILED, outcome=CHANGED         |
| Payment becomes EXPIRED             | Gateway EXPIRED, outcome=CHANGED        |
| Gateway error during recovery       | outcome=FAILED, error logged            |
| Batch only selects valid candidates | Only PENDING with snapToken             |
| Manual recovery flow                | Same as scheduled recovery              |
| All sources call same service       | WEBHOOK, RECOVERY, MANUAL → same flow   |

---

# 🚦 Invariants

## Invariant 1: Recovery Never Changes Business Rules

```
Recovery
  │
  ▼ NEVER
changes business rule
```

Recovery only **finds** the latest status. Business remains `PaymentConfirmationService`.

## Invariant 2: One Payment → One Confirmation Flow

```
Webhook ──┐
Recovery ─┼──▶ PaymentConfirmationService
Manual ───┘
```

All sources (WEBHOOK, RECOVERY, MANUAL) pass through the same service.

## Invariant 3: Gateway is Source of Truth

```
Gateway ──▶ Status
              │
              ▼
Database ◀─── (follows gateway)
```

For payment status, the gateway is authoritative. Database follows gateway.

## Invariant 4: Recovery Doesn't Know Business Logic [v2]

```
RecoveryService
  │
  ▼
synchronizeStatus()
  │
  ▼
ConfirmationService decides
  │
  ▼
confirm / fail / expire
```

Recovery only coordinates. ConfirmationService handles state transitions.

---

# 🔗 Dependencies

## Prerequisites (Completed in Earlier Steps)

- ✅ `PaymentGateway` interface
- ✅ `MidtransGateway` implementation
- ✅ `MidtransTransactionStatus` type
- ✅ `PaymentConfirmationService`
- ✅ `PaymentRepository`
- ✅ `PaymentStatus` enum

## This Step

- [ ] Extend `PaymentGateway` interface with `getTransactionStatus()`
- [ ] Implement `getTransactionStatus()` in `MidtransGateway`
- [ ] Create `PaymentRecoveryService`
- [ ] Create `PaymentRecoveryRepository`
- [ ] Create `PaymentRecoveryScheduler`
- [ ] Add `PaymentConfirmationSource` enum
- [ ] Add `PaymentConfirmationService.synchronizeStatus()`
- [ ] Update `PaymentConfirmationService` with source parameter

---

# 🟢 Conclusion

## STATUS: READY TO CODE (v2)

**Rationale:**

1. All prerequisites from Step 7 are complete
2. Architecture follows existing patterns exactly
3. Scope is bounded and precise
4. No changes to existing stable APIs
5. Recovery is additive, not modifying
6. [v2] Explicit `RecoveryOutcome` prevents misclassification
7. [v2] `synchronizeStatus()` keeps business logic in ConfirmationService
8. [v2] Manual recovery reuses `recoverPayment()` - no duplication

**This completes Phase 5 foundation for payment reliability.**

---

# 📝 Revision History

| Version | Date       | Change                           |
| ------- | ---------- | -------------------------------- |
| v1      | 2026-07-05 | Initial blueprint                |
| v2      | 2026-07-05 | Based on Senior Architect review |
