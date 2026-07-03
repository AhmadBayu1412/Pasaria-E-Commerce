// ============================================================
// CHECKOUT QUEUE PRODUCER
// Phase 4 Step 8: Background Checkout Jobs
//
// Enqueues jobs AFTER database transaction commits
// Only two job types: Email + Audit Log
// ============================================================

import { getProductQueue } from "./bullmq.js"

/**
 * Checkout Email Job Data
 */
export interface CheckoutEmailJob {
  readonly type: "checkout_email";
  readonly orderId: number;
  readonly userId: number;
  readonly email: string;
  readonly template: "order_confirmation";
  readonly data: {
    orderId: number;
    totalAmount: number;
    itemCount: number;
  };
  readonly timestamp: number;
}

/**
 * Checkout Audit Job Data
 */
export interface CheckoutAuditJob {
  readonly type: "checkout_audit";
  readonly orderId: number;
  readonly userId: number;
  readonly action: "ORDER_CONFIRMED";
  readonly metadata: {
    totalAmount: number;
    itemCount: number;
    transactionTimeMs: number;
  };
  readonly timestamp: number;
}

/**
 * Checkout Queue Producer
 *
 * Enqueues jobs to BullMQ after database transaction commits.
 * This function is fire-and-forget for the calling service.
 */
export const CheckoutQueueProducer = {
  /**
   * Enqueue order confirmation email
   *
   * IMPORTANT: Call this AFTER database transaction commits
   *
   * @param input - CheckoutEmailJob data without type and timestamp
   * @returns Job ID if successful, undefined if failed
   */
  async enqueueOrderConfirmationEmail(
    input: Omit<CheckoutEmailJob, "type" | "timestamp">
  ): Promise<string | undefined> {
    const queue = getProductQueue() // Reuse existing queue for now

    const jobData: CheckoutEmailJob = {
      type: "checkout_email",
      ...input,
      timestamp: Date.now(),
    }

    try {
      const job = await queue.add(jobData.type, jobData, {
        jobId: `checkout-email-${input.orderId}-${Date.now()}`,
      })

      console.log(`[CHECKOUT PRODUCER] Enqueued email job for order ${input.orderId}`)

      return job.id
    } catch (error) {
      console.error(`[CHECKOUT PRODUCER] Failed to enqueue email job:`, error)
      return undefined
    }
  },

  /**
   * Enqueue audit log
   *
   * IMPORTANT: Call this AFTER database transaction commits
   *
   * @param input - CheckoutAuditJob data without type and timestamp
   * @returns Job ID if successful, undefined if failed
   */
  async enqueueAuditLog(
    input: Omit<CheckoutAuditJob, "type" | "timestamp">
  ): Promise<string | undefined> {
    const queue = getProductQueue() // Reuse existing queue for now

    const jobData: CheckoutAuditJob = {
      type: "checkout_audit",
      ...input,
      timestamp: Date.now(),
    }

    try {
      const job = await queue.add(jobData.type, jobData, {
        jobId: `checkout-audit-${input.orderId}-${Date.now()}`,
      })

      console.log(`[CHECKOUT PRODUCER] Enqueued audit job for order ${input.orderId}`)

      return job.id
    } catch (error) {
      console.error(`[CHECKOUT PRODUCER] Failed to enqueue audit job:`, error)
      return undefined
    }
  },
} as const
