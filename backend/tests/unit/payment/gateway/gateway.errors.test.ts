// ============================================================
// GATEWAY ERRORS — UNIT TESTS
// Phase 5 Step 4: Gateway Abstraction
// ============================================================

import { describe, it, expect } from 'vitest';
import { PaymentGatewayError } from '../../../../modules/payment/gateways/gateway.errors.js';

describe('PaymentGatewayError', () => {
  describe('constructor', () => {
    it('should create error with correct properties', () => {
      const error = new PaymentGatewayError(
        'Test error',
        'NETWORK_ERROR',
        true,
        { originalError: new Error('original') },
      );

      expect(error.message).toBe('Test error');
      expect(error.type).toBe('NETWORK_ERROR');
      expect(error.isRetryable).toBe(true);
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.name).toBe('PaymentGatewayError');
    });

    it('should work without options', () => {
      const error = new PaymentGatewayError(
        'Test error',
        'AUTH_ERROR',
        false,
      );

      expect(error.originalError).toBeUndefined();
    });
  });

  describe('static factory methods', () => {
    it('networkError should create retryable network error', () => {
      const error = PaymentGatewayError.networkError('Connection failed');

      expect(error.type).toBe('NETWORK_ERROR');
      expect(error.isRetryable).toBe(true);
      expect(error.message).toBe('Connection failed');
    });

    it('timeoutError should create retryable timeout error', () => {
      const error = PaymentGatewayError.timeoutError('Request timed out');

      expect(error.type).toBe('TIMEOUT_ERROR');
      expect(error.isRetryable).toBe(true);
      expect(error.message).toBe('Request timed out');
    });

    it('authError should create non-retryable auth error', () => {
      const error = PaymentGatewayError.authError('Invalid API key');

      expect(error.type).toBe('AUTH_ERROR');
      expect(error.isRetryable).toBe(false);
      expect(error.message).toBe('Invalid API key');
    });

    it('invalidRequest should create non-retryable request error', () => {
      const error = PaymentGatewayError.invalidRequest('Missing required field');

      expect(error.type).toBe('INVALID_REQUEST');
      expect(error.isRetryable).toBe(false);
      expect(error.message).toBe('Missing required field');
    });

    it('providerError should create retryable provider error', () => {
      const error = PaymentGatewayError.providerError('Provider unavailable');

      expect(error.type).toBe('PROVIDER_ERROR');
      expect(error.isRetryable).toBe(true);
      expect(error.message).toBe('Provider unavailable');
    });
  });

  describe('error types coverage', () => {
    const errorTypes: Array<{
      type: 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'AUTH_ERROR' | 'INVALID_REQUEST' | 'PROVIDER_ERROR';
      retryable: boolean;
    }> = [
      { type: 'NETWORK_ERROR', retryable: true },
      { type: 'TIMEOUT_ERROR', retryable: true },
      { type: 'AUTH_ERROR', retryable: false },
      { type: 'INVALID_REQUEST', retryable: false },
      { type: 'PROVIDER_ERROR', retryable: true },
    ];

    errorTypes.forEach(({ type, retryable }) => {
      it(`should support ${type} error type`, () => {
        const error = new PaymentGatewayError(type, type, retryable);
        expect(error.type).toBe(type);
        expect(error.isRetryable).toBe(retryable);
      });
    });
  });

  describe('instanceof check', () => {
    it('should be instance of Error', () => {
      const error = PaymentGatewayError.networkError('test');
      expect(error).toBeInstanceOf(Error);
    });

    it('should be instance of PaymentGatewayError', () => {
      const error = PaymentGatewayError.networkError('test');
      expect(error).toBeInstanceOf(PaymentGatewayError);
    });
  });
});
