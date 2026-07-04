// ============================================================
// ORDER LIFECYCLE RULES
// Phase 5 Step 1: Pure Validation
//
// Philosophy:
// - NO side effects
// - NO database access
// - Pure functions ONLY
// - NO timeout logic (Step 8)
// - NO trigger types (future steps)
// - NO preview methods
// ============================================================

import {
  OrderStateTransitions,
  type OrderStatus,
  TERMINAL_STATES,
  PAYABLE_STATES,
} from './order-lifecycle.types.js';

// Type-safe array includes helper
const arrayIncludes = <T extends readonly unknown[]>(
  arr: T,
  value: unknown,
): value is T[number] => arr.includes(value as T[number]);

export const OrderLifecycleRules = {
  // ----- Core Transition Validation -----

  /**
   * Check if transition is valid
   * Step 1 ONLY capability
   */
  canTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
  ): boolean {
    const allowed = OrderStateTransitions[currentStatus]?.canTransitionTo;
    if (!allowed) return false;
    return arrayIncludes(allowed, targetStatus);
  },

  // ----- State Classification -----

  /**
   * Check if status is terminal (no further transitions)
   */
  isTerminal(status: OrderStatus): boolean {
    return TERMINAL_STATES.includes(status);
  },

  /**
   * Check if payment can be initiated from this status
   */
  isPayable(status: OrderStatus): boolean {
    return PAYABLE_STATES.includes(status);
  },

  // ----- Helpers -----

  /**
   * Get all valid next states from current state
   */
  getValidNextStates(status: OrderStatus): readonly OrderStatus[] {
    return OrderStateTransitions[status]?.canTransitionTo ?? [];
  },
} as const;
