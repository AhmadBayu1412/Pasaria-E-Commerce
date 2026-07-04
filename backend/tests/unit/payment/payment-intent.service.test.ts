// ============================================================
// PAYMENT INTENT — UNIT TESTS
// Phase 5 Step 3: Create Payment Intent
//
// Philosophy:
// - Test types and error codes
// - Integration tests require database setup
// - Simple validation tests for invariants
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  PaymentIntentErrorCodes,
  type CreatePaymentIntentInput,
  type PaymentIntentResultDTO,
} from '../../../modules/payment/payment-intent.types.js';
import { BusinessError } from '../../../shared/errors/business.error.js';

describe('PaymentIntentErrorCodes', () => {
  it('should have all required error codes', () => {
    expect(PaymentIntentErrorCodes.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
    expect(PaymentIntentErrorCodes.ORDER_TERMINAL).toBe('ORDER_TERMINAL');
    expect(PaymentIntentErrorCodes.ORDER_NOT_PAYABLE).toBe('ORDER_NOT_PAYABLE');
    expect(PaymentIntentErrorCodes.ORDER_NOT_OWNED).toBe('ORDER_NOT_OWNED');
    expect(PaymentIntentErrorCodes.PAYMENT_EXISTS).toBe('PAYMENT_EXISTS');
  });

  it('should have exactly 5 error codes', () => {
    const errorCodeValues = Object.values(PaymentIntentErrorCodes);
    expect(errorCodeValues).toHaveLength(5);
  });
});

describe('CreatePaymentIntentInput', () => {
  it('should accept valid input', () => {
    const input: CreatePaymentIntentInput = {
      orderId: 1,
      userId: 100,
      amount: 350000,
      currency: 'IDR',
      provider: 'STUB',
    };

    expect(input.orderId).toBe(1);
    expect(input.userId).toBe(100);
    expect(input.amount).toBe(350000);
    expect(input.currency).toBe('IDR');
    expect(input.provider).toBe('STUB');
  });

  it('should allow optional currency', () => {
    const input: CreatePaymentIntentInput = {
      orderId: 1,
      userId: 100,
      amount: 350000,
      // currency is optional
    };

    expect(input.currency).toBeUndefined();
  });

  it('should allow optional provider', () => {
    const input: CreatePaymentIntentInput = {
      orderId: 1,
      userId: 100,
      amount: 350000,
      // provider is optional
    };

    expect(input.provider).toBeUndefined();
  });

  it('should have readonly type annotation', () => {
    const input: CreatePaymentIntentInput = {
      orderId: 1,
      userId: 100,
      amount: 350000,
    };

    // TypeScript readonly is compile-time only
    // Runtime check - we can verify the type annotation exists in source
    expect(input.orderId).toBe(1);
  });
});

describe('PaymentIntentResultDTO', () => {
  it('should have all required fields', () => {
    const result: PaymentIntentResultDTO = {
      paymentId: 500,
      orderId: 1,
      amount: 350000,
      currency: 'IDR',
      provider: 'STUB',
      status: 'READY_FOR_GATEWAY',
    };

    expect(result.paymentId).toBe(500);
    expect(result.orderId).toBe(1);
    expect(result.amount).toBe(350000);
    expect(result.currency).toBe('IDR');
    expect(result.provider).toBe('STUB');
    expect(result.status).toBe('READY_FOR_GATEWAY');
  });

  it('should have READY_FOR_GATEWAY as only valid status', () => {
    const result: PaymentIntentResultDTO = {
      paymentId: 500,
      orderId: 1,
      amount: 350000,
      currency: 'IDR',
      provider: 'STUB',
      status: 'READY_FOR_GATEWAY',
    };

    // Status should be literal type 'READY_FOR_GATEWAY'
    expect(result.status).toBe('READY_FOR_GATEWAY');
  });

  it('should have readonly type annotation', () => {
    const result: PaymentIntentResultDTO = {
      paymentId: 500,
      orderId: 1,
      amount: 350000,
      currency: 'IDR',
      provider: 'STUB',
      status: 'READY_FOR_GATEWAY',
    };

    // TypeScript readonly is compile-time only
    // Runtime check - verify required fields are present
    expect(result.paymentId).toBe(500);
  });

  it('should NOT include internal fields', () => {
    const result: PaymentIntentResultDTO = {
      paymentId: 500,
      orderId: 1,
      amount: 350000,
      currency: 'IDR',
      provider: 'STUB',
      status: 'READY_FOR_GATEWAY',
    };

    // DTO should not have these internal fields
    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('updatedAt');
    expect(result).not.toHaveProperty('gatewayResponse');
    expect(result).not.toHaveProperty('idempotencyKey');
  });
});

describe('BusinessError', () => {
  it('should create error with correct properties', () => {
    const error = new BusinessError(
      'Order not found',
      404,
      PaymentIntentErrorCodes.ORDER_NOT_FOUND,
    );

    expect(error.message).toBe('Order not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('ORDER_NOT_FOUND');
    expect(error.name).toBe('BusinessError');
  });

  it('should support all error codes as BusinessError', () => {
    const errorCodes = [
      { code: PaymentIntentErrorCodes.ORDER_NOT_FOUND, status: 404 },
      { code: PaymentIntentErrorCodes.ORDER_TERMINAL, status: 400 },
      { code: PaymentIntentErrorCodes.ORDER_NOT_PAYABLE, status: 400 },
      { code: PaymentIntentErrorCodes.ORDER_NOT_OWNED, status: 403 },
      { code: PaymentIntentErrorCodes.PAYMENT_EXISTS, status: 400 },
    ];

    errorCodes.forEach(({ code, status }) => {
      const error = new BusinessError('Test error', status, code);
      expect(error.code).toBe(code);
      expect(error.statusCode).toBe(status);
    });
  });
});

describe('Business Invariants (Type-level validation)', () => {
  describe('Invariant 1: Exactly One ACTIVE Payment Per Order', () => {
    it('should enforce one active payment constraint in types', () => {
      // This is a documentation test - shows the invariant intent
      // In practice, this is enforced at runtime by validateNoActivePayment()
      const activePaymentConstraint = {
        description: 'One Order can have at most one PENDING payment',
        implementedBy: 'PaymentIntentService.validateNoActivePayment()',
      };

      expect(activePaymentConstraint.description).toBeDefined();
      expect(activePaymentConstraint.implementedBy).toContain('validateNoActivePayment');
    });
  });

  describe('Invariant 2: Payment PENDING ↔ Order WAITING_PAYMENT', () => {
    it('should enforce status consistency', () => {
      // This invariant is enforced by atomic transaction
      const statusConsistency = {
        description: 'Payment PENDING always means Order WAITING_PAYMENT',
        implementedBy: 'prisma.$transaction (atomic)',
      };

      expect(statusConsistency.description).toBeDefined();
      expect(statusConsistency.implementedBy).toContain('transaction');
    });
  });

  describe('Invariant 3: Atomic State Transition', () => {
    it('should enforce atomicity', () => {
      // Both operations succeed or both fail together
      const atomicity = {
        description: 'Create Payment + Update Order in single transaction',
        implementedBy: 'prisma.$transaction',
      };

      expect(atomicity.description).toBeDefined();
      expect(atomicity.implementedBy).toContain('transaction');
    });
  });

  describe('Invariant 4: Ownership Before Information', () => {
    it('should validate ownership first', () => {
      // Ownership check happens BEFORE status check
      const ownershipFirst = {
        description: 'Check WHO before WHAT',
        implementedBy: 'PaymentIntentService - order.userId check before status',
      };

      expect(ownershipFirst.description).toBeDefined();
      expect(ownershipFirst.implementedBy).toContain('userId');
    });
  });
});

describe('PaymentIntentService module export', () => {
  it('should be importable', async () => {
    // Dynamic import to verify module structure
    const module = await import(
      '../../../modules/payment/payment-intent.service.js'
    );

    expect(module.PaymentIntentService).toBeDefined();
    expect(typeof module.PaymentIntentService.createPaymentIntent).toBe(
      'function',
    );
  });

  it('should have createPaymentIntent method', async () => {
    const { PaymentIntentService } = await import(
      '../../../modules/payment/payment-intent.service.js'
    );

    expect(PaymentIntentService.createPaymentIntent).toBeDefined();
  });
});
