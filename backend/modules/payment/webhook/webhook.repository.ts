// ============================================================
// WEBHOOK REPOSITORY
// Phase 5 Step 6: Event Deduplication
//
// Philosophy:
// - Pure data access: find, insert, update
// - NO business logic
// - Caller (WebhookService) decides what to do with results
// ============================================================

import { prisma } from '../../../infra/db/prisma.js';
import type {
  WebhookEventRecord,
  WebhookEventStatus,
} from './webhook.types.js';

interface PrismaWebhookEvent {
  id: number;
  gatewayTransactionId: string;
  gatewayProvider: string;
  eventType: string;
  paymentId: number | null;
  rawPayload: unknown;
  status: string;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toRecord(r: PrismaWebhookEvent): WebhookEventRecord {
  return {
    id: r.id,
    gatewayTransactionId: r.gatewayTransactionId,
    gatewayProvider: r.gatewayProvider as WebhookEventRecord['gatewayProvider'],
    eventType: r.eventType as WebhookEventRecord['eventType'],
    paymentId: r.paymentId,
    rawPayload: r.rawPayload as WebhookEventRecord['rawPayload'],
    status: r.status as WebhookEventStatus,
    processedAt: r.processedAt,
    errorMessage: r.errorMessage,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export const WebhookRepository = {
  /**
   * Find event by gateway transaction ID
   * Returns null if not found
   */
  async findByTransactionId(
    transactionId: string,
  ): Promise<WebhookEventRecord | null> {
    const record = await prisma.webhookEvent.findUnique({
      where: { gatewayTransactionId: transactionId },
    });
    return record ? toRecord(record) : null;
  },

  /**
   * Try to acquire event lock via atomic INSERT
   *
   * @returns { record, acquired }
   * - acquired=true: We own this event, proceed with processing
   * - acquired=false: Event exists, caller decides action
   */
  async acquireEvent(
    transactionId: string,
    provider: string,
    eventType: string,
    rawPayload: unknown,
  ): Promise<{ record: WebhookEventRecord | null; acquired: boolean }> {
    try {
      const record = await prisma.webhookEvent.create({
        data: {
          gatewayTransactionId: transactionId,
          gatewayProvider: provider,
          eventType,
          rawPayload: rawPayload as object,
          status: 'PENDING',
        },
      });

      return { record: toRecord(record), acquired: true };
    } catch (error: unknown) {
      // P2002 = Unique constraint violation = already exists
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        const existing = await prisma.webhookEvent.findUnique({
          where: { gatewayTransactionId: transactionId },
        });
        return {
          record: existing ? toRecord(existing) : null,
          acquired: false,
        };
      }
      throw error;
    }
  },

  /**
   * Mark event as processed and link to Payment
   */
  async markProcessed(
    transactionId: string,
    paymentId: number,
  ): Promise<WebhookEventRecord> {
    const record = await prisma.webhookEvent.update({
      where: { gatewayTransactionId: transactionId },
      data: {
        status: 'PROCESSED',
        paymentId,
        processedAt: new Date(),
      },
    });
    return toRecord(record);
  },

  /**
   * Mark event as failed (for audit/logging)
   */
  async markFailed(
    transactionId: string,
    errorMessage: string,
  ): Promise<WebhookEventRecord> {
    const record = await prisma.webhookEvent.update({
      where: { gatewayTransactionId: transactionId },
      data: {
        status: 'FAILED',
        errorMessage,
        processedAt: new Date(),
      },
    });
    return toRecord(record);
  },

  /**
   * Update event paymentId (for events processed externally)
   */
  async linkPayment(
    transactionId: string,
    paymentId: number,
  ): Promise<WebhookEventRecord> {
    const record = await prisma.webhookEvent.update({
      where: { gatewayTransactionId: transactionId },
      data: { paymentId },
    });
    return toRecord(record);
  },
} as const;
