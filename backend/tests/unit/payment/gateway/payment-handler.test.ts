// ============================================================
// PAYMENT HANDLER — UNIT TESTS
// Phase 5 Step 5: Idempotency Layer Integration
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentHandler } from '../../../../modules/payment/payment-handler.js';
import { PaymentGatewayError } from '../../../../modules/payment/gateways/gateway.errors.js';
import type { PaymentGateway } from '../../../../modules/payment/gateways/gateway.interface.js';

// Mock dependencies
vi.mock('../../../../modules/payment/payment-intent.service.js', () => ({
  PaymentIntentService: {
    createPaymentIntent: vi.fn().mockResolvedValue({
      paymentId: 1,
      orderId: 100,
      amount: 100000,
      currency: 'IDR',
      provider: 'STUB',
      status: 'READY_FOR_GATEWAY',
      externalReference: 'PAY-1-100',
    }),
  },
}));

vi.mock('../../../../modules/payment/idempotency/idempotency.service.js', () => ({
  IdempotencyService: class {
    acquire = vi.fn().mockResolvedValue({
      acquired: true,
      isReplay: false,
      cachedResponse: null,
    });
    complete = vi.fn().mockResolvedValue(undefined);
    fail = vi.fn().mockResolvedValue(undefined);
  },
}));

describe('PaymentHandler', () => {
  let mockGateway: PaymentGateway;

  beforeEach(() => {
    mockGateway = {
      createCharge: vi.fn().mockResolvedValue({
        chargeStatus: 'CREATED',
        snapToken: 'SNAP_123',
        redirectUrl: 'https://gateway.test/pay/123',
        externalReference: 'PAY-1-100',
        metadata: { orderId: 100, paymentId: 1, externalReference: 'PAY-1-100' },
        createdAt: new Date(),
      }),
    };
  });

  describe('initiatePayment', () => {
    it('should create payment intent and initiate charge with idempotency', async () => {
      const handler = new PaymentHandler(mockGateway);

      const result = await handler.initiatePayment({
        orderId: 100,
        userId: 1,
        amount: 100000,
        currency: 'IDR',
        returnUrl: 'https://example.com/return',
        idempotencyKey: 'test-key-123',
      });

      expect(result.paymentId).toBe(1);
      expect(result.orderId).toBe(100);
      expect(result.redirectUrl).toBe('https://gateway.test/pay/123');
      expect(result.snapToken).toBe('SNAP_123');
    });

    it('should call PaymentIntentService first', async () => {
      const handler = new PaymentHandler(mockGateway);

      await handler.initiatePayment({
        orderId: 100,
        userId: 1,
        amount: 100000,
        currency: 'IDR',
        idempotencyKey: 'test-key-123',
      });

      const { PaymentIntentService } = await import('../../../../modules/payment/payment-intent.service.js');
      expect(PaymentIntentService.createPaymentIntent).toHaveBeenCalledWith({
        orderId: 100,
        userId: 1,
        amount: 100000,
        currency: 'IDR',
        provider: undefined,
      });
    });

    it('should call gateway with correct parameters', async () => {
      const handler = new PaymentHandler(mockGateway);

      await handler.initiatePayment({
        orderId: 100,
        userId: 1,
        amount: 100000,
        currency: 'IDR',
        returnUrl: 'https://example.com/return',
        idempotencyKey: 'test-key-123',
      });

      expect(mockGateway.createCharge).toHaveBeenCalledWith({
        paymentId: 1,
        orderId: 100,
        amount: 100000,
        currency: 'IDR',
        returnUrl: 'https://example.com/return',
        externalReference: 'PAY-1-100',
      });
    });

    it('should propagate gateway error', async () => {
      mockGateway.createCharge = vi.fn().mockRejectedValue(
        PaymentGatewayError.networkError('Connection failed'),
      );
      const handler = new PaymentHandler(mockGateway);

      await expect(
        handler.initiatePayment({
          orderId: 100,
          userId: 1,
          amount: 100000,
          currency: 'IDR',
          idempotencyKey: 'test-key-123',
        }),
      ).rejects.toMatchObject({
        statusCode: 502,
        code: 'GATEWAY_ERROR',
      });
    });
  });

  describe('initiateChargeOnly', () => {
    it('should initiate charge for existing payment (no idempotency)', async () => {
      const handler = new PaymentHandler(mockGateway);

      const result = await handler.initiateChargeOnly(
        1,
        100,
        100000,
        'IDR',
        'PAY-1-100',
        'https://example.com/return',
      );

      expect(result.paymentId).toBe(1);
      expect(result.snapToken).toBe('SNAP_123');
      expect(mockGateway.createCharge).toHaveBeenCalledWith({
        paymentId: 1,
        orderId: 100,
        amount: 100000,
        currency: 'IDR',
        returnUrl: 'https://example.com/return',
        externalReference: 'PAY-1-100',
      });
    });

    it('should work without returnUrl', async () => {
      const handler = new PaymentHandler(mockGateway);

      await handler.initiateChargeOnly(1, 100, 100000, 'IDR', 'PAY-1-100');

      expect(mockGateway.createCharge).toHaveBeenCalledWith({
        paymentId: 1,
        orderId: 100,
        amount: 100000,
        currency: 'IDR',
        returnUrl: undefined,
        externalReference: 'PAY-1-100',
      });
    });
  });
});
