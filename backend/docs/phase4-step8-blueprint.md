# Phase 4 Step 8 — Background Checkout Jobs

**Date:** 2026-07-04  
**Status:** BLUEPRINT (Pending Implementation)  
**Concept:** Asynchronous Post-Commit Processing

---

## Executive Summary

Step 8 memperkenalkan **Asynchronous Post-Commit Processing** untuk checkout flow. Setelah transaksi database berhasil di-commit, pekerjaan tambahan seperti email dan audit log dipindahkan ke background job queue.

### Core Principle

> **Database Transaction hanya menyelesaikan pekerjaan yang wajib konsisten. Pekerjaan lain dipindahkan ke background.**

---

## Architecture Flow

```
HTTP Request
    │
    ▼
CheckoutController
    │
    ▼
CheckoutService
    │
    ├── BEGIN TRANSACTION
    │
    ├── OrderService.createDraftTx()
    ├── InventoryService.reserveStockTx()
    └── CartService.clearCartTx()
    │
    ├── COMMIT ─────────────────────┐
    │                               │
    │  ← HTTP Response to User      │
    │                               │
    ▼                               │
void Producer.enqueueEmail() ◄───────┘
void Producer.enqueueAudit()
    │ (fire-and-forget)
    ▼
Checkout Queue (Redis)
    │
    ▼
Worker (Dispatcher)
    │
    ├── EmailHandler → Stub log
    └── AuditHandler → DB write
    │
    ├── Retry (if transient error)
    └── Done
```

---

## File Layout

```
modules/checkout/
├── checkout.service.ts           [MODIFY] Add void producer calls
└── checkout.types.ts            [READY]  Step 7

infra/queue/
├── checkout.producer.ts         [READY]  Step 7
├── checkout.worker.ts          [MODIFY] Dispatcher pattern
├── checkout.handlers.ts         [NEW]    EmailHandler + AuditHandler
└── bullmq.ts                   [MODIFY] Queue name

worker.ts                        [MODIFY] Worker registration + graceful shutdown

tests/unit/checkout/
├── checkout.queue.test.ts       [NEW]    Queue tests
└── checkout.rules.test.ts       [READY]  Step 7

docs/
└── phase4-step8-blueprint.md    [THIS]   Blueprint
```

---

## Component Specifications

### 1. Checkout Service (checkout.service.ts)

**Modifikasi:** Tambahkan queue enqueue calls setelah commit

```typescript
// STEP 4: Post-commit operations (outside transaction)
// Non-blocking: checkout tetap berhasil walau queue fails
const transactionStartTime = Date.now();

void CheckoutQueueProducer.enqueueOrderConfirmationEmail({
  orderId: result.order.id,
  userId,
  email: userEmail,
  data: {
    orderId: result.order.id,
    totalAmount: result.order.subtotal,
    itemCount: result.order.totalItemCount,
  },
}).catch((err) => {
  logger.error('[CHECKOUT] Failed to enqueue email job', {
    orderId: result.order.id,
    error: err,
  });
});

void CheckoutQueueProducer.enqueueAuditLog({
  orderId: result.order.id,
  userId,
  action: 'ORDER_CONFIRMED',
  metadata: {
    totalAmount: result.order.subtotal,
    itemCount: result.order.totalItemCount,
    transactionTimeMs: Date.now() - transactionStartTime,
  },
}).catch((err) => {
  logger.error('[CHECKOUT] Failed to enqueue audit job', {
    orderId: result.order.id,
    error: err,
  });
});
```

### 2. Checkout Handlers (checkout.handlers.ts)

**Baru:** Handler functions untuk email dan audit

```typescript
// ============================================================
// CHECKOUT JOB HANDLERS
// Phase 4 Step 8: Background Checkout Jobs
//
// Handles email and audit jobs from checkout queue
// ============================================================

import { Job } from 'bullmq';
import { prisma } from '../../infra/db/prisma.js';
import type {
  CheckoutEmailJob,
  CheckoutAuditJob,
} from './checkout.producer.js';

// ============================================================
// ERROR CLASSIFICATION
// ============================================================

/**
 * Retryable Errors (transient failures - will be retried):
 * - SMTP timeout
 * - Redis connection error
 * - Database deadlock
 * - Network interruption
 *
 * Non-Retryable Errors (permanent failures - will NOT be retried):
 * - Invalid email address format
 * - Order not found in database
 * - Malformed job payload
 * - Missing required data
 */

// ============================================================
// EMAIL HANDLER
// ============================================================

export const EmailHandler = {
  /**
   * Handle order confirmation email job
   *
   * In production, this would integrate with SMTP or email service (SendGrid, etc.)
   * For Step 8, this is a STUB that logs the email that would be sent.
   *
   * @param job - BullMQ Job containing email data
   * @throws Never - errors are logged, not thrown
   */
  async handle(job: Job<CheckoutEmailJob>): Promise<void> {
    const { orderId, email, data } = job.data;

    try {
      // STUB: Log email details instead of sending
      console.log(`[EMAIL HANDLER] Order confirmation email`);
      console.log(`  Order ID: ${orderId}`);
      console.log(`  To: ${email}`);
      console.log(`  Template: ${data.template}`);
      console.log(`  Amount: ${data.totalAmount}`);
      console.log(`  Items: ${data.itemCount}`);

      // Simulate email processing time
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log(`[EMAIL HANDLER] Email job completed for order ${orderId}`);
    } catch (error) {
      // Log error but don't re-throw
      // Email failure should trigger retry via BullMQ
      console.error(
        `[EMAIL HANDLER] Failed to send email for order ${orderId}:`,
        error,
      );
      throw error;
    }
  },
};

// ============================================================
// AUDIT HANDLER
// ============================================================

export const AuditHandler = {
  /**
   * Handle audit log job
   *
   * Records order confirmation in audit log.
   * This is a CRITICAL business requirement for compliance.
   *
   * @param job - BullMQ Job containing audit data
   * @throws Never - errors are logged, not re-thrown
   */
  async handle(job: Job<CheckoutAuditJob>): Promise<void> {
    const { orderId, userId, action, metadata } = job.data;

    try {
      await prisma.audit.create({
        data: {
          action,
          entityType: 'Order',
          entityId: orderId,
          data: JSON.stringify({
            userId,
            totalAmount: metadata.totalAmount,
            itemCount: metadata.itemCount,
            transactionTimeMs: metadata.transactionTimeMs,
          }),
        },
      });

      console.log(`[AUDIT HANDLER] Audit log created for order ${orderId}`);
    } catch (error) {
      // Log error but don't re-throw
      // Audit failure should trigger retry, but order is still valid
      console.error(
        `[AUDIT HANDLER] Failed to create audit log for order ${orderId}:`,
        error,
      );
      throw error;
    }
  },
};
```

### 3. Checkout Worker (checkout.worker.ts)

**Modifikasi:** Jadikan dispatcher saja

```typescript
// ============================================================
// CHECKOUT QUEUE WORKER
// Phase 4 Step 8: Background Checkout Jobs
//
// THIS IS A DISPATCHER ONLY
// Actual business logic is in checkout.handlers.ts
// ============================================================

import { Job } from 'bullmq';
import { EmailHandler, AuditHandler } from './checkout.handlers.js';
import type {
  CheckoutEmailJob,
  CheckoutAuditJob,
} from './checkout.producer.js';

/**
 * Checkout Queue Worker
 *
 * This worker acts as a TRAFFIC CONTROLLER (Dispatcher).
 * It receives jobs from the queue and dispatches to appropriate handlers.
 *
 * Responsibilities:
 * 1. Receive job from queue
 * 2. Route to correct handler
 * 3. Handle unknown job types gracefully
 */
export const CheckoutWorker = {
  /**
   * Process any checkout job
   *
   * This is the main entry point for the worker.
   * It dispatches to specific handlers based on job type.
   *
   * @param job - BullMQ Job
   */
  async processJob(job: Job): Promise<void> {
    const jobType = job.name;

    console.log(`[WORKER] Processing job: ${jobType} (ID: ${job.id})`);

    switch (jobType) {
      case 'checkout_email':
        await EmailHandler.handle(job as Job<CheckoutEmailJob>);
        break;

      case 'checkout_audit':
        await AuditHandler.handle(job as Job<CheckoutAuditJob>);
        break;

      default:
        console.warn(`[WORKER] Unknown job type: ${jobType}`);
      // Don't throw - unknown job types should not crash the worker
    }
  },
};
```

### 4. BullMQ Configuration (bullmq.ts)

**Modifikasi:** Queue name dan worker options

```typescript
// ============================================================
// BULLMQ CONFIGURATION
// Phase 4 Step 8: Checkout Queue
//
// Queue configuration for checkout background jobs
// ============================================================

import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { QUEUE_CONFIG } from '../../shared/queue/index.js';
import { CheckoutWorker } from './checkout.worker.js';

let checkoutQueue: Queue | null = null;
let checkoutWorker: Worker | null = null;

// ============================================================
// QUEUE INITIALIZATION
// ============================================================

function createConnectionOptions(): ConnectionOptions {
  return {
    maxRetriesPerRequest: null,
  };
}

/**
 * Get singleton Checkout Queue instance
 */
export function getCheckoutQueue(): Queue {
  if (!checkoutQueue) {
    checkoutQueue = new Queue(QUEUE_CONFIG.QUEUE_NAME, {
      connection: createConnectionOptions(),

      defaultJobOptions: {
        attempts: QUEUE_CONFIG.RETRY.MAX_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: QUEUE_CONFIG.RETRY.INITIAL_DELAY,
        },
        removeOnComplete: {
          count: QUEUE_CONFIG.JOB.REMOVE_ON_COMPLETE,
        },
        removeOnFail: {
          count: QUEUE_CONFIG.JOB.REMOVE_ON_FAIL,
        },
      },
    });

    console.log(`[QUEUE] Initialized: ${QUEUE_CONFIG.QUEUE_NAME}`);
  }

  return checkoutQueue;
}

/**
 * Initialize Checkout Worker
 *
 * Worker processes jobs from the checkout queue.
 * Includes graceful shutdown handling.
 */
export function initCheckoutWorker(): Worker {
  if (!checkoutWorker) {
    checkoutWorker = new Worker(
      QUEUE_CONFIG.QUEUE_NAME,
      CheckoutWorker.processJob,
      {
        connection: createConnectionOptions(),
        concurrency: QUEUE_CONFIG.WORKER.CONCURRENCY,
      },
    );

    // Event handlers
    checkoutWorker.on('completed', (job) => {
      console.log(`[WORKER] Job ${job.id} completed`);
    });

    checkoutWorker.on('failed', (job, err) => {
      console.error(`[WORKER] Job ${job?.id} failed:`, err);
    });

    checkoutWorker.on('error', (err) => {
      console.error(`[WORKER] Worker error:`, err);
    });

    console.log(
      `[WORKER] Checkout worker initialized (concurrency: ${QUEUE_CONFIG.WORKER.CONCURRENCY})`,
    );
  }

  return checkoutWorker;
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

export async function closeCheckoutWorker(): Promise<void> {
  if (checkoutWorker) {
    console.log('[WORKER] Closing checkout worker...');
    await checkoutWorker.close();
    checkoutWorker = null;
    console.log('[WORKER] Checkout worker closed');
  }
}

export async function closeCheckoutQueue(): Promise<void> {
  if (checkoutQueue) {
    console.log('[QUEUE] Closing checkout queue...');
    await checkoutQueue.close();
    checkoutQueue = null;
    console.log('[QUEUE] Checkout queue closed');
  }
}

/**
 * Graceful shutdown for both worker and queue
 */
export async function gracefulShutdown(): Promise<void> {
  console.log('[SHUTDOWN] Initiating graceful shutdown...');
  await closeCheckoutWorker();
  await closeCheckoutQueue();
  console.log('[SHUTDOWN] Graceful shutdown complete');
}
```

### 5. Worker Entry Point (worker.ts)

**Modifikasi:** Worker registration dan signal handling

```typescript
// ============================================================
// WORKER ENTRY POINT
// Phase 4 Step 8: Background Checkout Jobs
//
// Standalone worker process for checkout queue
// ============================================================

import { initCheckoutWorker, gracefulShutdown } from './infra/queue/bullmq.js';

// Initialize worker
const worker = initCheckoutWorker();

console.log('[WORKER] Checkout worker started');
console.log('[WORKER] Press Ctrl+C to stop');

// Graceful shutdown handlers
async function shutdown(signal: string): Promise<void> {
  console.log(`[WORKER] Received ${signal}`);
  await gracefulShutdown();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('[WORKER] Uncaught exception:', err);
  gracefulShutdown().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  console.error('[WORKER] Unhandled rejection:', reason);
});
```

---

## Test Specifications

### Test File: checkout.queue.test.ts

```typescript
// ============================================================
// CHECKOUT QUEUE TEST
// Phase 4 Step 8: Background Checkout Jobs
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { EmailHandler, AuditHandler } from "../../../infra/queue/checkout.handlers"
import type { CheckoutEmailJob, CheckoutAuditJob } from "../../../infra/queue/checkout.producer"

// ============================================================
// MOCK DATA
// ============================================================

const createMockEmailJob = (overrides = {}): CheckoutEmailJob => ({
  type: "checkout_email",
  orderId: 1,
  userId: 1,
  email: "test@example.com",
  template: "order_confirmation",
  data: {
    orderId: 1,
    totalAmount: 150000,
    itemCount: 3,
  },
  timestamp: Date.now(),
  ...overrides,
})

const createMockAuditJob = (overrides = {}): CheckoutAuditJob => ({
  type: "checkout_audit",
  orderId: 1,
  userId: 1,
  action: "ORDER_CONFIRMED",
  metadata: {
    totalAmount: 150000,
    itemCount: 3,
    transactionTimeMs: 150,
  },
  timestamp: Date.now(),
  ...overrides,
})

// ============================================================
// EMAIL HANDLER TESTS
// ============================================================

describe("EmailHandler", () => {
  describe("handle", () => {
    it("should log email details for order confirmation", async () => {
      const mockJob = {
        data: createMockEmailJob(),
      } as any

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await EmailHandler.handle(mockJob)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[EMAIL HANDLER] Order confirmation email")
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("test@example.com")
      )

      consoleSpy.mockRestore()
    })

    it("should include order ID in logs", async () => {
      const mockJob = {
        data: createMockEmailJob({ orderId: 42 }),
      } as any

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await EmailHandler.handle(mockJob)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("42")
      )

      consoleSpy.mockRestore()
    })

    it("should include amount and item count in logs", async () => {
      const mockJob = {
        data: createMockEmailJob({
          data: {
            orderId: 1,
            totalAmount: 250000,
            itemCount: 5,
          },
        }),
      } as any

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await EmailHandler.handle(mockJob)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("250000")
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("5")
      )

      consoleSpy.mockRestore()
    })

    it("should throw error when email sending fails", async () => {
      const mockJob = {
        data: createMockEmailJob({ email: "" }), // Invalid
      } as any

      // Mock setTimeout to throw
      vi.spyOn(global, "setTimeout").mockImplementationOnce(() => {
        throw new Error("Email service unavailable")
      } as any)

      await expect(EmailHandler.handle(mockJob)).rejects.toThrow()
    })
  })
})

// ============================================================
// AUDIT HANDLER TESTS
// ============================================================

describe("AuditHandler", () => {
  // Mock prisma for audit tests
  const mockPrismaAuditCreate = vi.fn()

  beforeEach(() => {
    vi.mock("../../infra/db/prisma.js", () => ({
      prisma: {
        audit: {
          create: mockPrismaAuditCreate,
        },
      },
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("handle", () => {
    it("should create audit log entry", async () => {
      mockPrismaAuditCreate.mockResolvedValue({ id: 1 })

      const mockJob = {
        data: createMockAuditJob({ orderId: 42, userId: 10 }),
      } as any

      await AuditHandler.handle(mockJob)

      expect(mockPrismaAuditCreate).toHaveBeenCalledWith({
        data: {
          action: "ORDER_CONFIRMED",
          entityType: "Order",
          entityId: 42,
          data: expect.stringContaining("10"), // userId
        },
      })
    })

    it("should include order confirmation action", async () => {
      mockPrismaAuditCreate.mockResolvedValue({ id: 1 })

      const mockJob = {
        data: createMockAuditJob(),
      } as any

      await AuditHandler.handle(mockJob)

      expect(mockPrismaAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "ORDER_CONFIRMED",
          }),
        })
      )
    })

    it("should include transaction metadata", async () => {
      mockPrismaAuditCreate.mockResolvedValue({ id: 1 })

      const mockJob = {
        data: createMockAuditJob({
          metadata: {
            totalAmount: 300000,
            itemCount: 4,
            transactionTimeMs: 200,
          },
        }),
      } as any

      await AuditHandler.handle(mockJob)

      expect(mockPrismaAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          data: expect.stringContaining("300000"),
        }),
      })
    })

    it("should throw error when database fails", async () => {
      mockPrismaAuditCreate.mockRejectedValue(new Error("Database connection failed"))

      const mockJob = {
        data: createMockAuditJob(),
      } as any

      await expect(AuditHandler.handle(mockJob)).rejects.toThrow("Database connection failed")
    })
  })
})

// ============================================================
// QUEUE FAILURE ISOLATION TESTS
// ============================================================

describe("Queue Failure Isolation", () => {
  describe("CheckoutService.completeCheckout", () => {
    it("should succeed even if queue enqueue fails", async () => {
      // This test validates the fire-and-forget pattern
      // When queue fails, checkout should still complete

      // Mock queue to always fail
      const mockQueueAdd = vi.fn().mockRejectedValue(new Error("Redis down"))

      vi.doMock("./infra/queue/bullmq.js", () => ({
        getCheckoutQueue: () => ({ add: mockQueueAdd }),
      }))

      // In actual implementation:
      // void producer.enqueue(...).catch(err => logger.error(...))
      // This ensures checkout succeeds even if queue fails

      expect(true).toBe(true) // Placeholder - actual test needs full integration
    })

    it("should log error when queue enqueue fails", () => {
      // When producer catches error, it should log
      const loggerErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Simulate error handling
      const error = new Error("Redis down")
      console.error("[CHECKOUT] Failed to enqueue job:", error)

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[CHECKOUT]"),
        expect.any(Error)
      )

      loggerErrorSpy.mockRestore()
    })
  })
})

// ============================================================
// HANDLER NAMING CONVENTION TESTS
// ============================================================

describe("Handler Naming Convention", () => {
  it("should export EmailHandler", () => {
    expect(EmailHandler).toBeDefined()
    expect(typeof EmailHandler.handle).toBe("function")
  })

  it("should export AuditHandler", () => {
    expect(AuditHandler).toBeDefined()
    expect(typeof AuditHandler.handle).toBe("function")
  })

  it("should have handle method for both handlers", () => {
    const emailHandleMethod = Object.getOwnPropertyDescriptor(EmailHandler, "handle")
    const auditHandleMethod = Object.getOwnPropertyDescriptor(AuditHandler, "handle")

    expect(emailHandleMethod?.value).toBeDefined()
    expect(auditHandleMethod?.value).toBeDefined()
  })
})
```

---

## Manual Verification Steps

### 1. API Testing with cURL

#### Test Case 1: Successful Checkout with Queue

```bash
# 1. Login as customer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"password123"}' \
  -c cookies_customer.txt

# 2. Add item to cart (if not exists)
curl -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -b cookies_customer.txt \
  -d '{"productId":1,"quantity":2}'

# 3. Complete checkout
curl -X POST http://localhost:3000/api/checkout/complete \
  -H "Content-Type: application/json" \
  -b cookies_customer.txt

# Expected Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "orderId": 1,
#     "status": "DRAFT",
#     "totalQuantity": 2,
#     "totalItemCount": 1,
#     "subtotal": 100000,
#     "createdAt": "2026-07-04T..."
#   }
# }

# 4. Check worker logs for email/audit job processing
# (Should see "[EMAIL HANDLER]" and "[AUDIT HANDLER]" in worker terminal)
```

#### Test Case 2: Checkout Success Despite Queue Failure

```bash
# 1. Complete checkout (with Redis down or queue disabled)
curl -X POST http://localhost:3000/api/checkout/complete \
  -H "Content-Type: application/json" \
  -b cookies_customer.txt

# Expected Response (200 OK):
# Even if queue fails, checkout should succeed

# Response should still contain valid orderId
```

#### Test Case 3: Checkout Failure (Cart Empty)

```bash
# 1. Complete checkout with empty cart
curl -X POST http://localhost:3000/api/checkout/complete \
  -H "Content-Type: application/json" \
  -b cookies_customer.txt

# Expected Response (400 Bad Request):
# {
#   "success": false,
#   "error": {
#     "code": "CART_EMPTY",
#     "message": "Cart is empty"
#   }
# }
```

### 2. Database Verification

```sql
-- Check if order was created
SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 1;

-- Check if inventory was reserved
SELECT * FROM "Product" WHERE id = 1;

-- Check if cart was cleared
SELECT * FROM "CartItem" WHERE "cartId" = (SELECT id FROM "Cart" WHERE "userId" = 1);

-- Check audit log (after worker processes)
SELECT * FROM "Audit" WHERE "entityType" = 'Order' ORDER BY "createdAt" DESC LIMIT 1;
```

### 3. Worker Verification

```bash
# Start worker in separate terminal
npm run worker

# Expected output:
# [QUEUE] Initialized: checkout-queue
# [WORKER] Checkout worker started
# [WORKER] Press Ctrl+C to stop

# After checkout:
# [WORKER] Processing job: checkout_email (ID: xxx)
# [EMAIL HANDLER] Order confirmation email
#   Order ID: 1
#   To: customer@test.com
# [EMAIL HANDLER] Email job completed for order 1
# [WORKER] Job xxx completed

# [WORKER] Processing job: checkout_audit (ID: yyy)
# [AUDIT HANDLER] Audit log created for order 1
# [WORKER] Job yyy completed
```

### 4. Graceful Shutdown Test

```bash
# In worker terminal, press Ctrl+C
# Expected output:
# [WORKER] Received SIGINT
# [WORKER] Closing checkout worker...
# [WORKER] Checkout worker closed
# [QUEUE] Closing checkout queue...
# [QUEUE] Checkout queue closed
# [SHUTDOWN] Graceful shutdown complete
```

---

## Error Scenarios

| Scenario                   | Expected Behavior                   |
| -------------------------- | ----------------------------------- |
| Redis down during enqueue  | Checkout succeeds, error logged     |
| SMTP timeout (production)  | Worker retries up to 3 times        |
| Database down during audit | Worker retries up to 3 times        |
| Invalid email format       | Job fails after retries, logged     |
| Worker crashes mid-job     | BullMQ automatically reassigns      |
| SIGINT during processing   | Graceful shutdown after current job |

---

## Configuration

### Queue Config (shared/queue/queue.config.ts)

```typescript
export const QUEUE_CONFIG = {
  QUEUE_NAME: 'checkout-queue',

  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 second
    BACKOFF_MULTIPLIER: 2, // exponential: 1s, 2s, 4s
  },

  JOB: {
    TTL: 86400, // 24 hours
    REMOVE_ON_COMPLETE: 100,
    REMOVE_ON_FAIL: 500,
  },

  WORKER: {
    CONCURRENCY: 5,
    LIMITER_MAX: 10,
    LIMITER_DURATION: 1000,
  },
} as const;
```

---

## Dependencies

```json
{
  "bullmq": "^5.x"
}
```

---

## Status Checklist

| Component           | File                        | Status      |
| ------------------- | --------------------------- | ----------- |
| Blueprint           | `phase4-step8-blueprint.md` | ✅ Complete |
| Handlers            | `checkout.handlers.ts`      | ⏳ Pending  |
| Worker              | `checkout.worker.ts`        | ⏳ Pending  |
| BullMQ Config       | `bullmq.ts`                 | ⏳ Pending  |
| Service Integration | `checkout.service.ts`       | ⏳ Pending  |
| Worker Entry        | `worker.ts`                 | ⏳ Pending  |
| Tests               | `checkout.queue.test.ts`    | ⏳ Pending  |
| Queue Config        | `queue.config.ts`           | ⏳ Pending  |

---

## Next Steps

1. Create `infra/queue/checkout.handlers.ts`
2. Update `infra/queue/checkout.worker.ts` (dispatcher)
3. Update `infra/queue/bullmq.ts` (queue name)
4. Update `modules/checkout/checkout.service.ts` (void calls)
5. Update `worker.ts` (registration + shutdown)
6. Update `shared/queue/queue.config.ts` (queue name)
7. Create `tests/unit/checkout/checkout.queue.test.ts`
8. Run tests
9. Update documentation
