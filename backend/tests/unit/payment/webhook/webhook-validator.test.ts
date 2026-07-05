// ============================================================
// WEBHOOK VALIDATOR UNIT TESTS
// Phase 5 Step 6: Webhook Processing & Payment Confirmation
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookValidator } from '../../../../modules/payment/webhook/webhook.validator.js';
import type { WebhookPayload, GatewayProvider } from '../../../../modules/payment/webhook/webhook.types.js';

describe('WebhookValidator', () => {
  let validator: WebhookValidator;

  const validPayload: WebhookPayload = {
    transactionId: 'txn_123',
    orderId: 'order_456',
    status: 'success',
    amount: 100000,
    currency: 'IDR',
    timestamp: '2026-07-04T10:00:00Z',
    signature: 'test-signature',
  };

  describe('constructor', () => {
    it('should create validator with STUB verifier by default', () => {
      validator = new WebhookValidator();
      expect(validator.supports('STUB')).toBe(true);
    });

    it('should disable STUB verifier when stubEnabled is false', () => {
      validator = new WebhookValidator({ stubEnabled: false });
      expect(validator.supports('STUB')).toBe(false);
    });
  });

  describe('verify()', () => {
    beforeEach(() => {
      validator = new WebhookValidator({ stubEnabled: true });
    });

    it('should return valid result for STUB provider with signature', () => {
      const result = validator.verify(validPayload, 'STUB');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('STUB');
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for unsupported provider', () => {
      const result = validator.verify(validPayload, 'MIDTRANS');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported provider');
    });

    it('should return invalid when signature is missing', () => {
      const payloadWithoutSignature: WebhookPayload = {
        ...validPayload,
        signature: undefined,
      };
      const result = validator.verify(payloadWithoutSignature, 'STUB');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing signature');
    });

    it('should return invalid when signature is empty string', () => {
      const payloadWithEmptySignature: WebhookPayload = {
        ...validPayload,
        signature: '',
      };
      const result = validator.verify(payloadWithEmptySignature, 'STUB');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing signature');
    });
  });

  describe('supports()', () => {
    it('should return true for STUB when enabled', () => {
      validator = new WebhookValidator({ stubEnabled: true });
      expect(validator.supports('STUB')).toBe(true);
    });

    it('should return false for STUB when disabled', () => {
      validator = new WebhookValidator({ stubEnabled: false });
      expect(validator.supports('STUB')).toBe(false);
    });

    it('should return false for MIDTRANS (not implemented in Step 6)', () => {
      validator = new WebhookValidator();
      expect(validator.supports('MIDTRANS')).toBe(false);
    });

    it('should return false for XENDIT (not implemented in Step 6)', () => {
      validator = new WebhookValidator();
      expect(validator.supports('XENDIT')).toBe(false);
    });
  });
});
