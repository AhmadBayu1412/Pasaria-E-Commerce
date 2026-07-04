// ============================================================
// CHECKOUT QUEUE WORKER
// Phase 4 Step 8: Background Checkout Jobs
//
// THIS IS A DISPATCHER ONLY
// Actual business logic is in checkout.handlers.ts
// ============================================================

import { Job } from "bullmq"
import { EmailHandler, AuditHandler } from "./checkout.handlers.js"
import type {
  CheckoutEmailJob,
  CheckoutAuditJob,
} from "./checkout.producer.js"

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
    const jobType = job.name

    console.log(`[WORKER] Processing job: ${jobType} (ID: ${job.id})`)

    switch (jobType) {
      case "checkout_email":
        await EmailHandler.handle(job as Job<CheckoutEmailJob>)
        break

      case "checkout_audit":
        await AuditHandler.handle(job as Job<CheckoutAuditJob>)
        break

      default:
        console.warn(`[WORKER] Unknown job type: ${jobType}`)
      // Don't throw - unknown job types should not crash the worker
    }
  },
}
