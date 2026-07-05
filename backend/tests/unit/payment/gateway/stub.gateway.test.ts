// ============================================================
// STUB GATEWAY — UNIT TESTS
// Phase 5 Step 4: Gateway Abstraction
// ============================================================

import { describe, it, expect } from 'vitest';
import { StubGateway } from '../../../../modules/payment/gateways/stub/stub.gateway.js';
import { PaymentGatewayError } from '../../../../modules/payment/gateways/gateway.errors.js';

describe('StubGateway', () => {
  const createValidRequest = () => ({
    paymentId: 1,
    orderId: 100,
    amount: 100000,
    currency: 'IDR',
    returnUrl: 'https://example.com/return',
  });

  describe('successful charge creation', () => {
    it('should create charge successfully with default options', async () => {
      const gateway = new StubGateway();
      const request = createValidRequest();

      const result = await gateway.createCharge(request);

      expect(result.chargeStatus).toBe('CREATED');
      expect(result.gatewayTransactionId).toMatch(/^STUB_\d+_1$/);
      expect(result.redirectUrl).toContain('stub-gateway.pasaria.test');
      expect(result.metadata.paymentId).toBe(1);
      expect(result.metadata.orderId).toBe(100);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique transaction IDs', async () => {
      const gateway = new StubGateway();
      const request = createValidRequest();

      const result1 = await gateway.createCharge(request);
      await new Promise((r) => setTimeout(r, 10));
      const result2 = await gateway.createCharge(request);

      expect(result1.gatewayTransactionId).not.toBe(result2.gatewayTransactionId);
    });

    it('should handle request without returnUrl', async () => {
      const gateway = new StubGateway();
      const request = {
        paymentId: 1,
        orderId: 100,
        amount: 100000,
        currency: 'IDR',
      };

      const result = await gateway.createCharge(request);

      expect(result.chargeStatus).toBe('CREATED');
      expect(result.redirectUrl).toBeTruthy();
    });
  });

  describe('failed charge creation', () => {
    it('should throw PaymentGatewayError when shouldSucceed is false', async () => {
      const gateway = new StubGateway({ shouldSucceed: false });
      const request = createValidRequest();

      await expect(gateway.createCharge(request)).rejects.toThrow(
        PaymentGatewayError,
      );
    });

    it('should throw error with PROVIDER_ERROR type', async () => {
      const gateway = new StubGateway({ shouldSucceed: false });
      const request = createValidRequest();

      await expect(gateway.createCharge(request)).rejects.toMatchObject({
        type: 'PROVIDER_ERROR',
        isRetryable: true,
      });
    });

    it('should include original error message', async () => {
      const gateway = new StubGateway({ shouldSucceed: false });
      const request = createValidRequest();

      await expect(gateway.createCharge(request)).rejects.toMatchObject({
        message: expect.stringContaining('StubGateway'),
      });
    });
  });

  describe('simulated delay', () => {
    it('should not delay by default', async () => {
      const gateway = new StubGateway();
      const request = createValidRequest();

      const start = Date.now();
      await gateway.createCharge(request);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });

    it('should delay when simulatedDelayMs is set', async () => {
      const gateway = new StubGateway({ simulatedDelayMs: 100 });
      const request = createValidRequest();

      const start = Date.now();
      await gateway.createCharge(request);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(95);
    });

    it('should delay correctly with shouldSucceed false', async () => {
      const gateway = new StubGateway({
        shouldSucceed: false,
        simulatedDelayMs: 50,
      });
      const request = createValidRequest();

      const start = Date.now();
      await expect(gateway.createCharge(request)).rejects.toThrow();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('metadata', () => {
    it('should include correct paymentId in metadata', async () => {
      const gateway = new StubGateway();
      const request = createValidRequest();

      const result = await gateway.createCharge(request);

      expect(result.metadata.paymentId).toBe(request.paymentId);
    });

    it('should include correct orderId in metadata', async () => {
      const gateway = new StubGateway();
      const request = createValidRequest();

      const result = await gateway.createCharge(request);

      expect(result.metadata.orderId).toBe(request.orderId);
    });
  });
});
