// ============================================================
// WEBHOOK SERVICE UNIT TESTS
// Phase 5 Step 6: Webhook Processing & Payment Confirmation
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookService } from '../../../../modules/payment/webhook/webhook.service.js';
import { WebhookValidator } from '../../../../modules/payment/webhook/webhook.validator.js';
import { WebhookRepository } from '../../../../modules/payment/webhook/webhook.repository.js';
import type { WebhookPayload, GatewayProvider } from '../../../../modules/payment/webhook/webhook.types.js';

// Mock dependencies
vi.mock('../../../../modules/payment/webhook/webhook.repository.js');
vi.mock('../../../../modules/payment/payment-confirmation.service.js');

describe('WebhookService', () => {
  let service: WebhookService;
  let validator: WebhookValidator;

  const validPayload: WebhookPayload = {
    transactionId: 'txn_123',
    orderId: '1',
    status: 'success',
    amount: 100000,
    currency: 'IDR',
    timestamp: '2026-07-04T10:00:00Z',
    signature: 'valid-signature',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    validator = new WebhookValidator({ stubEnabled: true });
    // We create service with dependencies
    service = new WebhookService(
      validator,
      // @ts-ignore - mock service
      {
        confirmPayment: vi.fn().mockResolvedValue({
          paymentId: 1,
          orderId: 1,
          previousPaymentStatus: 'PENDING',
          newPaymentStatus: 'SUCCESS',
        }),
      },
    );
  });

  describe('processWebhook()', () => {
    it('should process new webhook event successfully', async () => {
      // Mock repository responses
      vi.mocked(WebhookRepository.acquireEvent).mockResolvedValue({
        acquired: true,
        record: {
          id: 1,
          gatewayTransactionId: 'txn_123',
          gatewayProvider: 'STUB' as GatewayProvider,
          eventType: 'PAYMENT_SETTLEMENT',
          paymentId: null,
          rawPayload: validPayload,
          status: 'PENDING' as const,
          processedAt: null,
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      vi.mocked(WebhookRepository.markProcessed).mockResolvedValue({
        id: 1,
        gatewayTransactionId: 'txn_123',
        status: 'PROCESSED' as const,
        paymentId: 1,
        gatewayProvider: 'STUB',
        eventType: 'PAYMENT_SETTLEMENT',
        rawPayload: {},
        processedAt: new Date(),
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.processWebhook(validPayload, 'STUB');

      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual({ received: true, processed: true });
      expect(result.shouldLog).toBe(false);
    });

    it('should return 403 for invalid signature', async () => {
      const invalidPayload: WebhookPayload = {
        ...validPayload,
        signature: '', // Empty signature
      };

      const result = await service.processWebhook(invalidPayload, 'STUB');

      expect(result.statusCode).toBe(403);
      expect(result.shouldLog).toBe(true);
    });

    it('should handle duplicate event when already acquired', async () => {
      // When acquireEvent returns acquired=false, the service should handle duplicate
      vi.mocked(WebhookRepository.acquireEvent).mockResolvedValue({
        acquired: false,
        record: {
          id: 1,
          gatewayTransactionId: 'txn_123',
          gatewayProvider: 'STUB' as GatewayProvider,
          eventType: 'PAYMENT_SETTLEMENT',
          paymentId: 1,
          rawPayload: validPayload,
          status: 'PROCESSED' as const,
          processedAt: new Date(),
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const result = await service.processWebhook(validPayload, 'STUB');

      expect(result.statusCode).toBe(200);
      // Note: actual response depends on service implementation
      expect(result.body).toHaveProperty('received');
    });

    it('should return 200 and log error when payment confirmation fails', async () => {
      vi.mocked(WebhookRepository.acquireEvent).mockResolvedValue({
        acquired: true,
        record: {
          id: 1,
          gatewayTransactionId: 'txn_123',
          gatewayProvider: 'STUB' as GatewayProvider,
          eventType: 'PAYMENT_SETTLEMENT',
          paymentId: null,
          rawPayload: validPayload,
          status: 'PENDING' as const,
          processedAt: null,
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Get the mock confirmation service from the service
      const confirmationService = (service as any).confirmationService;
      confirmationService.confirmPayment.mockRejectedValue(new Error('Payment not found'));

      vi.mocked(WebhookRepository.markFailed).mockResolvedValue({
        id: 1,
        gatewayTransactionId: 'txn_123',
        status: 'FAILED' as const,
        paymentId: null,
        gatewayProvider: 'STUB',
        eventType: 'PAYMENT_SETTLEMENT',
        rawPayload: {},
        processedAt: new Date(),
        errorMessage: 'Payment not found',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.processWebhook(validPayload, 'STUB');

      // Returns 200 to stop gateway retry
      expect(result.statusCode).toBe(200);
      expect(result.shouldLog).toBe(true);
      expect(WebhookRepository.markFailed).toHaveBeenCalledWith('txn_123', 'Payment not found');
    });

    it('should throw WebhookMissingFieldError when transactionId is missing', async () => {
      const invalidPayload: WebhookPayload = {
        ...validPayload,
        transactionId: undefined as any,
      };

      await expect(service.processWebhook(invalidPayload, 'STUB')).rejects.toThrow(
        'Missing required field: transactionId',
      );
    });

    it('should throw WebhookMissingFieldError when orderId is missing', async () => {
      const invalidPayload: WebhookPayload = {
        ...validPayload,
        orderId: undefined as any,
      };

      await expect(service.processWebhook(invalidPayload, 'STUB')).rejects.toThrow(
        'Missing required field: orderId',
      );
    });

    it('should throw WebhookPayloadError when amount is invalid', async () => {
      const invalidPayload: WebhookPayload = {
        ...validPayload,
        amount: -1000,
      };

      await expect(service.processWebhook(invalidPayload, 'STUB')).rejects.toThrow(
        'Invalid amount',
      );
    });
  });
});
