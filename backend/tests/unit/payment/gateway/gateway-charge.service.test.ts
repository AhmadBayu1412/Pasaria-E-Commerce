// ============================================================
// GATEWAY CHARGE SERVICE — UNIT TESTS
// Phase 5 Step 4: Gateway Abstraction
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { GatewayChargeService } from '../../../../modules/payment/gateway-charge.service.js';
import { PaymentGatewayError } from '../../../../modules/payment/gateways/gateway.errors.js';
import type { PaymentGateway } from '../../../../modules/payment/gateways/gateway.interface.js';
import type { CreateChargeRequest, CreateChargeResult } from '../../../../modules/payment/gateways/gateway.types.js';
import type { InitiateChargeInput } from '../../../../modules/payment/gateway-charge.types.js';

describe('GatewayChargeService', () => {
  const createMockGateway = (overrides?: Partial<CreateChargeResult>): PaymentGateway => ({
    createCharge: vi.fn().mockResolvedValue({
      chargeStatus: 'CREATED',
      snapToken: 'SNAP_123',
      redirectUrl: 'https://gateway.test/pay/123',
      externalReference: 'PAY-1-100',
      metadata: { orderId: 100, paymentId: 1, externalReference: 'PAY-1-100' },
      createdAt: new Date(),
      ...overrides,
    }),
  });

  const createValidInput = (): InitiateChargeInput => ({
    paymentId: 1,
    orderId: 100,
    amount: 100000,
    currency: 'IDR',
    returnUrl: 'https://example.com/return',
    externalReference: 'PAY-1-100',
  });

  describe('initiateCharge', () => {
    it('should create charge and return result', async () => {
      const gateway = createMockGateway();
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      const result = await service.initiateCharge(input);

      expect(result.paymentId).toBe(1);
      expect(result.snapToken).toBe('SNAP_123');
      expect(result.redirectUrl).toBe('https://gateway.test/pay/123');
      expect(result.chargeCreatedAt).toBeInstanceOf(Date);
    });

    it('should call gateway with correct request', async () => {
      const gateway = createMockGateway();
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      await service.initiateCharge(input);

      expect(gateway.createCharge).toHaveBeenCalledTimes(1);
      expect(gateway.createCharge).toHaveBeenCalledWith({
        paymentId: 1,
        orderId: 100,
        amount: 100000,
        currency: 'IDR',
        returnUrl: 'https://example.com/return',
        externalReference: 'PAY-1-100',
      });
    });

    it('should pass through metadata from request', async () => {
      const gateway = createMockGateway();
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      await service.initiateCharge(input);

      const calledRequest = (gateway.createCharge as ReturnType<typeof vi.fn>).mock.calls[0][0] as CreateChargeRequest;
      expect(calledRequest.paymentId).toBe(input.paymentId);
      expect(calledRequest.orderId).toBe(input.orderId);
    });
  });

  describe('error handling', () => {
    it('should throw BusinessError when gateway throws PaymentGatewayError', async () => {
      const gateway = {
        createCharge: vi.fn().mockRejectedValue(
          PaymentGatewayError.networkError('Connection refused'),
        ),
      } as PaymentGateway;
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      await expect(service.initiateCharge(input)).rejects.toMatchObject({
        statusCode: 502,
        code: 'GATEWAY_ERROR',
      });
    });

    it('should map AUTH_ERROR to 500', async () => {
      const gateway = {
        createCharge: vi.fn().mockRejectedValue(
          PaymentGatewayError.authError('Invalid credentials'),
        ),
      } as PaymentGateway;
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      await expect(service.initiateCharge(input)).rejects.toMatchObject({
        statusCode: 500,
      });
    });

    it('should map NETWORK_ERROR to 502', async () => {
      const gateway = {
        createCharge: vi.fn().mockRejectedValue(
          PaymentGatewayError.networkError('Connection refused'),
        ),
      } as PaymentGateway;
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      await expect(service.initiateCharge(input)).rejects.toMatchObject({
        statusCode: 502,
      });
    });

    it('should map TIMEOUT_ERROR to 502', async () => {
      const gateway = {
        createCharge: vi.fn().mockRejectedValue(
          PaymentGatewayError.timeoutError('Request timed out'),
        ),
      } as PaymentGateway;
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      await expect(service.initiateCharge(input)).rejects.toMatchObject({
        statusCode: 502,
      });
    });

    it('should map INVALID_REQUEST to 400', async () => {
      const gateway = {
        createCharge: vi.fn().mockRejectedValue(
          PaymentGatewayError.invalidRequest('Missing required field'),
        ),
      } as PaymentGateway;
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      await expect(service.initiateCharge(input)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should wrap unknown errors', async () => {
      const gateway = {
        createCharge: vi.fn().mockRejectedValue(new Error('Unexpected')),
      } as PaymentGateway;
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      await expect(service.initiateCharge(input)).rejects.toMatchObject({
        statusCode: 502,
        code: 'GATEWAY_ERROR',
      });
    });

    it('should throw when charge status is FAILED', async () => {
      const gateway = createMockGateway({ chargeStatus: 'FAILED' });
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      await expect(service.initiateCharge(input)).rejects.toMatchObject({
        statusCode: 502,
        code: 'GATEWAY_ERROR',
      });
    });
  });

  describe('redirectUrl handling', () => {
    it('should return redirectUrl from gateway', async () => {
      const gateway = createMockGateway({ redirectUrl: 'https://gateway.test/pay/456' });
      const service = new GatewayChargeService(gateway);
      const input = createValidInput();

      const result = await service.initiateCharge(input);

      expect(result.redirectUrl).toBe('https://gateway.test/pay/456');
    });
  });
});
