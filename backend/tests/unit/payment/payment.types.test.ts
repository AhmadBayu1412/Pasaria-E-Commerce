// ============================================================
// PAYMENT TYPES — Unit Tests
// Phase 5 Step 2: Payment Domain Foundation
//
// Philosophy:
// - Pure type tests only
// - No database access
// - No side effects
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  PAYMENT_TERMINAL_STATUSES,
  PAYMENT_ACTIVE_STATUSES,
} from '../../../modules/payment/payment.types.js';
import type { PaymentStatus } from '../../../modules/payment/payment.types.js';

describe('PaymentStatus', () => {
  it('should have all required statuses', () => {
    const statuses: PaymentStatus[] = [
      'PENDING',
      'SUCCESS',
      'DECLINED',
      'EXPIRED',
    ];
    expect(statuses.length).toBe(4);
  });
});

describe('PAYMENT_TERMINAL_STATUSES', () => {
  it('should contain SUCCESS, DECLINED, EXPIRED', () => {
    expect(PAYMENT_TERMINAL_STATUSES).toContain('SUCCESS');
    expect(PAYMENT_TERMINAL_STATUSES).toContain('DECLINED');
    expect(PAYMENT_TERMINAL_STATUSES).toContain('EXPIRED');
  });

  it('should have exactly 3 terminal statuses', () => {
    expect(PAYMENT_TERMINAL_STATUSES.length).toBe(3);
  });

  it('should NOT contain PENDING', () => {
    expect(PAYMENT_TERMINAL_STATUSES).not.toContain('PENDING');
  });
});

describe('PAYMENT_ACTIVE_STATUSES', () => {
  it('should contain only PENDING', () => {
    expect(PAYMENT_ACTIVE_STATUSES).toEqual(['PENDING']);
  });

  it('should have exactly 1 active status', () => {
    expect(PAYMENT_ACTIVE_STATUSES.length).toBe(1);
  });
});

describe('PaymentStatus classification', () => {
  it('SUCCESS should be terminal', () => {
    expect(PAYMENT_TERMINAL_STATUSES.includes('SUCCESS')).toBe(true);
  });

  it('DECLINED should be terminal', () => {
    expect(PAYMENT_TERMINAL_STATUSES.includes('DECLINED')).toBe(true);
  });

  it('EXPIRED should be terminal', () => {
    expect(PAYMENT_TERMINAL_STATUSES.includes('EXPIRED')).toBe(true);
  });

  it('PENDING should be active', () => {
    expect(PAYMENT_ACTIVE_STATUSES.includes('PENDING')).toBe(true);
  });
});
