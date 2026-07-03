// ============================================================
// CHECKOUT QUEUE WORKER
// Phase 4 Step 8: Background Checkout Jobs
//
// Processes checkout email and audit jobs
// Only two job types: Email + Audit Log
// ============================================================

import { Job } from "bullmq"
import type { CheckoutEmailJob, CheckoutAuditJob } from "./checkout.producer.js"
import { prisma } from "../../infra/db/prisma.js"

/**
 * Checkout Queue Worker
 *
 * Processes jobs from the checkout queue.
 * Only handles email and audit jobs.
 */
export const CheckoutWorker = {
  /**
   * Process checkout email job
   *
   * Sends order confirmation email to customer.
   * In production, this would integrate with SMTP or email service.
   *
   * @param job - BullMQ Job containing email data
   */
  async processEmailJob(job: Job<CheckoutEmailJob>): Promise<void> {
    const { orderId, email, data } = job.data

    console.log(`[CHECKOUT WORKER] Processing email job for order ${orderId}`)

    // TODO: Integrate with actual email service (SMTP, SendGrid, etc.)
    // For now, just log the email that would be sent
    console.log(`[CHECKOUT WORKER] Would send email to: ${email}`)
    console.log(`[CHECKOUT WORKER] Email template: order_confirmation`)
    console.log(`[CHECKOUT WORKER] Order ID: ${data.orderId}`)
    console.log(`[CHECKOUT WORKER] Total Amount: ${data.totalAmount}`)
    console.log(`[CHECKOUT WORKER] Item Count: ${data.itemCount}`)

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    console.log(`[CHECKOUT WORKER] Email job completed for order ${orderId}`)
  },

  /**
   * Process checkout audit job
   *
   * Records order confirmation in audit log.
   *
   * @param job - BullMQ Job containing audit data
   */
  async processAuditJob(job: Job<CheckoutAuditJob>): Promise<void> {
    const { orderId, userId, action, metadata } = job.data

    console.log(`[CHECKOUT WORKER] Processing audit job for order ${orderId}`)

    try {
      // Create audit log entry
      await prisma.audit.create({
        data: {
          action,
          entityType: "Order",
          entityId: orderId,
          data: JSON.stringify({
            userId,
            totalAmount: metadata.totalAmount,
            itemCount: metadata.itemCount,
            transactionTimeMs: metadata.transactionTimeMs,
          }),
        },
      })

      console.log(`[CHECKOUT WORKER] Audit log created for order ${orderId}`)
      console.log(`[CHECKOUT WORKER] Audit job completed for order ${orderId}`)
    } catch (error) {
      console.error(`[CHECKOUT WORKER] Failed to create audit log:`, error)
      throw error // Re-throw to trigger BullMQ retry
    }
  },

  /**
   * Process any checkout job
   *
   * Router function that delegates to specific handlers based on job type.
   *
   * @param job - BullMQ Job
   */
  async processJob(job: Job): Promise<void> {
    const jobType = job.name

    switch (jobType) {
      case "checkout_email":
        await this.processEmailJob(job as Job<CheckoutEmailJob>)
        break
      case "checkout_audit":
        await this.processAuditJob(job as Job<CheckoutAuditJob>)
        break
      default:
        console.warn(`[CHECKOUT WORKER] Unknown job type: ${jobType}`)
    }
  },
} as const
