// ============================================================
// ORDER RULES TEST
// Phase 4 Step 7: State Transition Rules
// Phase 5 Step 1: Updated for new OrderStatus values
// ============================================================

import { describe, it, expect } from 'vitest';
import { OrderRules } from '../../../modules/order/order.rules';
import { BusinessError } from '../../../shared/errors/business.error';

describe('OrderRules - State Transitions', () => {
  // ===== Valid Transitions =====

  describe('canTransition', () => {
    it('should allow DRAFT -> WAITING_PAYMENT', () => {
      expect(OrderRules.canTransition('DRAFT', 'WAITING_PAYMENT')).toBe(true);
    });

    it('should allow DRAFT -> CANCELLED', () => {
      expect(OrderRules.canTransition('DRAFT', 'CANCELLED')).toBe(true);
    });

    // Note: DRAFT -> EXPIRED is NOT allowed. EXPIRED only from WAITING_PAYMENT
    it('should NOT allow DRAFT -> EXPIRED directly', () => {
      expect(OrderRules.canTransition('DRAFT', 'EXPIRED')).toBe(false);
    });

    it('should allow WAITING_PAYMENT -> PAID', () => {
      expect(OrderRules.canTransition('WAITING_PAYMENT', 'PAID')).toBe(true);
    });

    it('should allow WAITING_PAYMENT -> CANCELLED', () => {
      expect(OrderRules.canTransition('WAITING_PAYMENT', 'CANCELLED')).toBe(true);
    });

    it('should allow WAITING_PAYMENT -> EXPIRED', () => {
      expect(OrderRules.canTransition('WAITING_PAYMENT', 'EXPIRED')).toBe(true);
    });
  });

  // ===== Invalid Transitions =====

  describe('canTransition - invalid transitions', () => {
    it('should NOT allow DRAFT -> PAID', () => {
      expect(OrderRules.canTransition('DRAFT', 'PAID')).toBe(false);
    });

    it('should NOT allow WAITING_PAYMENT -> DRAFT', () => {
      expect(OrderRules.canTransition('WAITING_PAYMENT', 'DRAFT')).toBe(false);
    });

    it('should NOT allow PAID -> any state', () => {
      expect(OrderRules.canTransition('PAID', 'DRAFT')).toBe(false);
      expect(OrderRules.canTransition('PAID', 'WAITING_PAYMENT')).toBe(false);
      expect(OrderRules.canTransition('PAID', 'EXPIRED')).toBe(false);
      expect(OrderRules.canTransition('PAID', 'CANCELLED')).toBe(false);
    });

    it('should NOT allow CANCELLED -> any state', () => {
      expect(OrderRules.canTransition('CANCELLED', 'DRAFT')).toBe(false);
      expect(OrderRules.canTransition('CANCELLED', 'WAITING_PAYMENT')).toBe(false);
      expect(OrderRules.canTransition('CANCELLED', 'PAID')).toBe(false);
    });

    it('should NOT allow EXPIRED -> any state', () => {
      expect(OrderRules.canTransition('EXPIRED', 'DRAFT')).toBe(false);
      expect(OrderRules.canTransition('EXPIRED', 'WAITING_PAYMENT')).toBe(false);
      expect(OrderRules.canTransition('EXPIRED', 'PAID')).toBe(false);
    });
  });

  // ===== assertTransition =====

  describe('assertTransition', () => {
    it('should NOT throw for valid transition', () => {
      expect(() => {
        OrderRules.assertTransition('DRAFT', 'WAITING_PAYMENT');
      }).not.toThrow();
    });

    it('should throw BusinessError for invalid transition', () => {
      expect(() => {
        OrderRules.assertTransition('DRAFT', 'PAID');
      }).toThrow(BusinessError);
    });

    it('should include correct error code', () => {
      try {
        OrderRules.assertTransition('DRAFT', 'PAID');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessError);
        expect((error as BusinessError).code).toBe('INVALID_STATE_TRANSITION');
      }
    });
  });

  // ===== getValidNextStates =====

  describe('getValidNextStates', () => {
    it('should return valid next states for DRAFT', () => {
      const states = OrderRules.getValidNextStates('DRAFT');
      expect(states).toContain('WAITING_PAYMENT');
      expect(states).toContain('CANCELLED');
      expect(states.length).toBe(2);
    });

    it('should return valid next states for WAITING_PAYMENT', () => {
      const states = OrderRules.getValidNextStates('WAITING_PAYMENT');
      expect(states).toContain('PAID');
      expect(states).toContain('EXPIRED');
      expect(states).toContain('CANCELLED');
      expect(states.length).toBe(3);
    });

    it('should return empty array for terminal states', () => {
      expect(OrderRules.getValidNextStates('PAID')).toEqual([]);
      expect(OrderRules.getValidNextStates('CANCELLED')).toEqual([]);
      expect(OrderRules.getValidNextStates('EXPIRED')).toEqual([]);
    });
  });

  // ===== isTerminalState =====

  describe('isTerminalState', () => {
    it('should return true for PAID', () => {
      expect(OrderRules.isTerminalState('PAID')).toBe(true);
    });

    it('should return true for CANCELLED', () => {
      expect(OrderRules.isTerminalState('CANCELLED')).toBe(true);
    });

    it('should return true for EXPIRED', () => {
      expect(OrderRules.isTerminalState('EXPIRED')).toBe(true);
    });

    it('should return false for DRAFT', () => {
      expect(OrderRules.isTerminalState('DRAFT')).toBe(false);
    });

    it('should return false for WAITING_PAYMENT', () => {
      expect(OrderRules.isTerminalState('WAITING_PAYMENT')).toBe(false);
    });
  });
});
