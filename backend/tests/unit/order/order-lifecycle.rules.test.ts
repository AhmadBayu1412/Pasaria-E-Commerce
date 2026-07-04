// ============================================================
// ORDER LIFECYCLE RULES — Unit Tests
// Phase 5 Step 1: Order Lifecycle Foundation
//
// Philosophy:
// - Pure function tests only
// - No database access
// - No side effects
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  OrderLifecycleRules,
} from '../../../modules/order/order-lifecycle.rules.js';
import {
  OrderStateTransitions,
  TERMINAL_STATES,
  PAYABLE_STATES,
} from '../../../modules/order/order-lifecycle.types.js';
import type { OrderStatus } from '../../../modules/order/order-lifecycle.types.js';

describe('OrderLifecycleRules', () => {
  // ============================================================
  // canTransition Tests
  // ============================================================

  describe('canTransition', () => {
    it('should allow DRAFT → WAITING_PAYMENT', () => {
      expect(OrderLifecycleRules.canTransition('DRAFT', 'WAITING_PAYMENT')).toBe(true);
    });

    it('should allow DRAFT → CANCELLED', () => {
      expect(OrderLifecycleRules.canTransition('DRAFT', 'CANCELLED')).toBe(true);
    });

    it('should NOT allow DRAFT → PAID', () => {
      expect(OrderLifecycleRules.canTransition('DRAFT', 'PAID')).toBe(false);
    });

    it('should NOT allow DRAFT → EXPIRED', () => {
      expect(OrderLifecycleRules.canTransition('DRAFT', 'EXPIRED')).toBe(false);
    });

    it('should allow WAITING_PAYMENT → PAID', () => {
      expect(OrderLifecycleRules.canTransition('WAITING_PAYMENT', 'PAID')).toBe(true);
    });

    it('should allow WAITING_PAYMENT → EXPIRED', () => {
      expect(OrderLifecycleRules.canTransition('WAITING_PAYMENT', 'EXPIRED')).toBe(true);
    });

    it('should allow WAITING_PAYMENT → CANCELLED', () => {
      expect(OrderLifecycleRules.canTransition('WAITING_PAYMENT', 'CANCELLED')).toBe(true);
    });

    it('should NOT allow WAITING_PAYMENT → DRAFT', () => {
      expect(OrderLifecycleRules.canTransition('WAITING_PAYMENT', 'DRAFT')).toBe(false);
    });

    it('should NOT allow PAID → any status (terminal)', () => {
      expect(OrderLifecycleRules.canTransition('PAID', 'DRAFT')).toBe(false);
      expect(OrderLifecycleRules.canTransition('PAID', 'WAITING_PAYMENT')).toBe(false);
      expect(OrderLifecycleRules.canTransition('PAID', 'EXPIRED')).toBe(false);
      expect(OrderLifecycleRules.canTransition('PAID', 'CANCELLED')).toBe(false);
    });

    it('should NOT allow EXPIRED → any status (terminal)', () => {
      expect(OrderLifecycleRules.canTransition('EXPIRED', 'DRAFT')).toBe(false);
      expect(OrderLifecycleRules.canTransition('EXPIRED', 'WAITING_PAYMENT')).toBe(false);
      expect(OrderLifecycleRules.canTransition('EXPIRED', 'PAID')).toBe(false);
      expect(OrderLifecycleRules.canTransition('EXPIRED', 'CANCELLED')).toBe(false);
    });

    it('should NOT allow CANCELLED → any status (terminal)', () => {
      expect(OrderLifecycleRules.canTransition('CANCELLED', 'DRAFT')).toBe(false);
      expect(OrderLifecycleRules.canTransition('CANCELLED', 'WAITING_PAYMENT')).toBe(false);
      expect(OrderLifecycleRules.canTransition('CANCELLED', 'PAID')).toBe(false);
      expect(OrderLifecycleRules.canTransition('CANCELLED', 'EXPIRED')).toBe(false);
    });
  });

  // ============================================================
  // isTerminal Tests
  // ============================================================

  describe('isTerminal', () => {
    it('should return true for PAID', () => {
      expect(OrderLifecycleRules.isTerminal('PAID')).toBe(true);
    });

    it('should return true for EXPIRED', () => {
      expect(OrderLifecycleRules.isTerminal('EXPIRED')).toBe(true);
    });

    it('should return true for CANCELLED', () => {
      expect(OrderLifecycleRules.isTerminal('CANCELLED')).toBe(true);
    });

    it('should return false for DRAFT', () => {
      expect(OrderLifecycleRules.isTerminal('DRAFT')).toBe(false);
    });

    it('should return false for WAITING_PAYMENT', () => {
      expect(OrderLifecycleRules.isTerminal('WAITING_PAYMENT')).toBe(false);
    });
  });

  // ============================================================
  // isPayable Tests
  // ============================================================

  describe('isPayable', () => {
    it('should return true for DRAFT', () => {
      expect(OrderLifecycleRules.isPayable('DRAFT')).toBe(true);
    });

    it('should return false for WAITING_PAYMENT', () => {
      expect(OrderLifecycleRules.isPayable('WAITING_PAYMENT')).toBe(false);
    });

    it('should return false for PAID (terminal)', () => {
      expect(OrderLifecycleRules.isPayable('PAID')).toBe(false);
    });

    it('should return false for CANCELLED (terminal)', () => {
      expect(OrderLifecycleRules.isPayable('CANCELLED')).toBe(false);
    });

    it('should return false for EXPIRED (terminal)', () => {
      expect(OrderLifecycleRules.isPayable('EXPIRED')).toBe(false);
    });
  });

  // ============================================================
  // getValidNextStates Tests
  // ============================================================

  describe('getValidNextStates', () => {
    it('should return [WAITING_PAYMENT, CANCELLED] for DRAFT', () => {
      const nextStates = OrderLifecycleRules.getValidNextStates('DRAFT');
      expect(nextStates).toEqual(['WAITING_PAYMENT', 'CANCELLED']);
    });

    it('should return [PAID, EXPIRED, CANCELLED] for WAITING_PAYMENT', () => {
      const nextStates = OrderLifecycleRules.getValidNextStates('WAITING_PAYMENT');
      expect(nextStates).toEqual(['PAID', 'EXPIRED', 'CANCELLED']);
    });

    it('should return empty array for PAID (terminal)', () => {
      const nextStates = OrderLifecycleRules.getValidNextStates('PAID');
      expect(nextStates).toEqual([]);
    });

    it('should return empty array for EXPIRED (terminal)', () => {
      const nextStates = OrderLifecycleRules.getValidNextStates('EXPIRED');
      expect(nextStates).toEqual([]);
    });

    it('should return empty array for CANCELLED (terminal)', () => {
      const nextStates = OrderLifecycleRules.getValidNextStates('CANCELLED');
      expect(nextStates).toEqual([]);
    });
  });
});

describe('OrderStateTransitions', () => {
  it('should have all required statuses', () => {
    const statuses = Object.keys(OrderStateTransitions) as OrderStatus[];
    expect(statuses).toContain('DRAFT');
    expect(statuses).toContain('WAITING_PAYMENT');
    expect(statuses).toContain('PAID');
    expect(statuses).toContain('EXPIRED');
    expect(statuses).toContain('CANCELLED');
    expect(statuses.length).toBe(5);
  });

  it('should have exactly 3 terminal states', () => {
    expect(TERMINAL_STATES).toEqual(['PAID', 'EXPIRED', 'CANCELLED']);
  });

  it('should have exactly 1 payable state', () => {
    expect(PAYABLE_STATES).toEqual(['DRAFT']);
  });

  it('each terminal state should have empty canTransitionTo array', () => {
    for (const status of TERMINAL_STATES) {
      expect(OrderStateTransitions[status].canTransitionTo).toEqual([]);
    }
  });

  it('DRAFT should be able to transition to WAITING_PAYMENT and CANCELLED', () => {
    expect(OrderStateTransitions.DRAFT.canTransitionTo).toEqual(['WAITING_PAYMENT', 'CANCELLED']);
  });

  it('WAITING_PAYMENT should be able to transition to PAID, EXPIRED, and CANCELLED', () => {
    expect(OrderStateTransitions.WAITING_PAYMENT.canTransitionTo).toEqual(['PAID', 'EXPIRED', 'CANCELLED']);
  });
});

// ============================================================
// Edge Case Tests
// ============================================================

describe('Edge Cases', () => {
  it('should not allow same-state transitions', () => {
    expect(OrderLifecycleRules.canTransition('DRAFT', 'DRAFT')).toBe(false);
    expect(OrderLifecycleRules.canTransition('WAITING_PAYMENT', 'WAITING_PAYMENT')).toBe(false);
    expect(OrderLifecycleRules.canTransition('PAID', 'PAID')).toBe(false);
  });

  it('should not allow backward transitions', () => {
    // Cannot go back from WAITING_PAYMENT
    expect(OrderLifecycleRules.canTransition('WAITING_PAYMENT', 'DRAFT')).toBe(false);

    // Cannot go back from PAID
    expect(OrderLifecycleRules.canTransition('PAID', 'WAITING_PAYMENT')).toBe(false);
    expect(OrderLifecycleRules.canTransition('PAID', 'DRAFT')).toBe(false);

    // Cannot go back from any terminal state
    for (const terminal of TERMINAL_STATES) {
      expect(OrderLifecycleRules.canTransition(terminal, 'DRAFT')).toBe(false);
      expect(OrderLifecycleRules.canTransition(terminal, 'WAITING_PAYMENT')).toBe(false);
    }
  });

  it('all statuses should have defined transitions', () => {
    const statuses = Object.keys(OrderStateTransitions) as OrderStatus[];
    for (const status of statuses) {
      expect(OrderStateTransitions[status]).toBeDefined();
      expect(Array.isArray(OrderStateTransitions[status].canTransitionTo)).toBe(true);
    }
  });
});
