// ============================================================
// CHECKOUT JOB HANDLERS
// Phase 4 Step 8: Background Checkout Jobs
//
// Handles email and audit jobs from checkout queue
// ============================================================

import { Job } from "bullmq"
import { prisma } from "../../infra/db/prisma.js"
import type {
  CheckoutEmailJob,
  CheckoutAuditJob,
} from "./checkout.producer.js"

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
   * @throws Error - re-throws to trigger BullMQ retry
   */
  async handle(job: Job<CheckoutEmailJob>): Promise<void> {
    const { orderId, email, data } = job.data

    try {
      // STUB: Log email details instead of sending
      console.log(`[EMAIL HANDLER] Order confirmation email`)
      console.log(`  Order ID: ${orderId}`)
      console.log(`  To: ${email}`)
      console.log(`  Template: ${data.template}`)
      console.log(`  Amount: ${data.totalAmount}`)
      console.log(`  Items: ${data.itemCount}`)

      // Simulate email processing time
      await new Promise((resolve) => setTimeout(resolve, 100))

      console.log(`[EMAIL HANDLER] Email job completed for order ${orderId}`)
    } catch (error) {
      // Log error and re-throw to trigger BullMQ retry
      console.error(
        `[EMAIL HANDLER] Failed to send email for order ${orderId}:`,
        error
      )
      throw error
    }
  },
}

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
   * @throws Error - re-throws to trigger BullMQ retry
   */
  async handle(job: Job<CheckoutAuditJob>): Promise<void> {
    const { orderId, userId, action, metadata } = job.data

    try {
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

      console.log(`[AUDIT HANDLER] Audit log created for order ${orderId}`)
    } catch (error) {
      // Log error and re-throw to trigger BullMQ retry
      console.error(
        `[AUDIT HANDLER] Failed to create audit log for order ${orderId}:`,
        error
      )
      throw error
    }
  },
}
