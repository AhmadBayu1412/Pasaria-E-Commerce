// ============================================================
// WEBHOOK REPOSITORY UNIT TESTS
// Phase 5 Step 6: Webhook Processing & Payment Confirmation
//
// These tests use mock Prisma client to test repository logic
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookRepository } from '../../../../modules/payment/webhook/webhook.repository.js';
import { prisma } from '../../../../infra/db/prisma.js';

// Mock Prisma
vi.mock('../../../../infra/db/prisma.js', () => ({
  prisma: {
    webhookEvent: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockPrisma = prisma as ReturnType<typeof vi.fn>;

describe('WebhookRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockWebhookEvent = {
    id: 1,
    gatewayTransactionId: 'txn_123',
    gatewayProvider: 'STUB',
    eventType: 'PAYMENT_SETTLEMENT',
    paymentId: null,
    rawPayload: { transactionId: 'txn_123' },
    status: 'PENDING',
    processedAt: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findByTransactionId()', () => {
    it('should return null when event not found', async () => {
      vi.mocked(mockPrisma.webhookEvent.findUnique).mockResolvedValue(null);

      const result = await WebhookRepository.findByTransactionId('txn_123');

      expect(result).toBeNull();
      expect(mockPrisma.webhookEvent.findUnique).toHaveBeenCalledWith({
        where: { gatewayTransactionId: 'txn_123' },
      });
    });

    it('should return event record when found', async () => {
      vi.mocked(mockPrisma.webhookEvent.findUnique).mockResolvedValue(mockWebhookEvent);

      const result = await WebhookRepository.findByTransactionId('txn_123');

      expect(result).not.toBeNull();
      expect(result?.gatewayTransactionId).toBe('txn_123');
      expect(result?.status).toBe('PENDING');
    });
  });

  describe('acquireEvent()', () => {
    it('should acquire event when it does not exist', async () => {
      vi.mocked(mockPrisma.webhookEvent.create).mockResolvedValue(mockWebhookEvent);

      const result = await WebhookRepository.acquireEvent(
        'txn_new',
        'STUB',
        'PAYMENT_SETTLEMENT',
        { test: 'payload' },
      );

      expect(result.acquired).toBe(true);
      expect(result.record).not.toBeNull();
      expect(result.record?.gatewayTransactionId).toBe('txn_123');
      expect(mockPrisma.webhookEvent.create).toHaveBeenCalled();
    });

    it('should return acquired=false when event already exists (P2002 error)', async () => {
      const uniqueError = new Error('Unique constraint');
      (uniqueError as unknown as { code: string }).code = 'P2002';
      vi.mocked(mockPrisma.webhookEvent.create).mockRejectedValue(uniqueError);
      vi.mocked(mockPrisma.webhookEvent.findUnique).mockResolvedValue(mockWebhookEvent);

      const result = await WebhookRepository.acquireEvent(
        'txn_123',
        'STUB',
        'PAYMENT_SETTLEMENT',
        { test: 'payload' },
      );

      expect(result.acquired).toBe(false);
      expect(mockPrisma.webhookEvent.findUnique).toHaveBeenCalledWith({
        where: { gatewayTransactionId: 'txn_123' },
      });
    });

    it('should throw non-P2002 errors', async () => {
      vi.mocked(mockPrisma.webhookEvent.create).mockRejectedValue(new Error('Database error'));

      await expect(
        WebhookRepository.acquireEvent('txn_123', 'STUB', 'PAYMENT_SETTLEMENT', {}),
      ).rejects.toThrow('Database error');
    });
  });

  describe('markProcessed()', () => {
    it('should update event status to PROCESSED and link payment', async () => {
      const processedEvent = {
        ...mockWebhookEvent,
        status: 'PROCESSED',
        paymentId: 1,
        processedAt: new Date(),
      };
      vi.mocked(mockPrisma.webhookEvent.update).mockResolvedValue(processedEvent);

      const result = await WebhookRepository.markProcessed('txn_123', 1);

      expect(result.status).toBe('PROCESSED');
      expect(result.paymentId).toBe(1);
      expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { gatewayTransactionId: 'txn_123' },
        data: {
          status: 'PROCESSED',
          paymentId: 1,
          processedAt: expect.any(Date),
        },
      });
    });
  });

  describe('markFailed()', () => {
    it('should update event status to FAILED with error message', async () => {
      const failedEvent = {
        ...mockWebhookEvent,
        status: 'FAILED',
        errorMessage: 'Payment not found',
        processedAt: new Date(),
      };
      vi.mocked(mockPrisma.webhookEvent.update).mockResolvedValue(failedEvent);

      const result = await WebhookRepository.markFailed('txn_123', 'Payment not found');

      expect(result.status).toBe('FAILED');
      expect(result.errorMessage).toBe('Payment not found');
      expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { gatewayTransactionId: 'txn_123' },
        data: {
          status: 'FAILED',
          errorMessage: 'Payment not found',
          processedAt: expect.any(Date),
        },
      });
    });
  });

  describe('linkPayment()', () => {
    it('should update event with paymentId', async () => {
      const linkedEvent = {
        ...mockWebhookEvent,
        paymentId: 5,
      };
      vi.mocked(mockPrisma.webhookEvent.update).mockResolvedValue(linkedEvent);

      const result = await WebhookRepository.linkPayment('txn_123', 5);

      expect(result.paymentId).toBe(5);
      expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { gatewayTransactionId: 'txn_123' },
        data: { paymentId: 5 },
      });
    });
  });
});
