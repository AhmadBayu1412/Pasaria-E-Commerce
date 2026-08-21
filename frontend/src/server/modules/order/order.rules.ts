// ============================================================
// ORDER RULES (Pure Validation Only)
// Phase 4 Step 6: Order Draft Foundation
// Phase 4 Step 7: State Transition Rules
//
// Philosophy:
// - ONLY pre-condition checks
// - NO business logic (that's service responsibility)
// - NO database access
// ============================================================

import { BusinessError } from "../../shared/errors/business.error"
import type { CheckoutPreview } from "../checkout/checkout.types"
import { OrderStateTransitions } from "./order.types"
import type { OrderStatus } from "./order.types"

export const OrderRules = {
  /**
   * V1: Checkout preview must be valid (all items available)
   */
  assertPreviewValid(preview: CheckoutPreview): void {
    if (!preview.validation.passed) {
      throw new BusinessError(
        "Checkout preview is not valid. Some items are unavailable.",
        400,
        "CHECKOUT_NOT_VALID"
      )
    }
  },

  /**
   * V2: Order must have at least one item
   */
  assertPreviewHasItems(preview: CheckoutPreview): void {
    const validItems = preview.items.filter((item) => item.status === "VALID")

    if (validItems.length === 0) {
      throw new BusinessError(
        "Order must have at least one valid item",
        400,
        "ORDER_EMPTY"
      )
    }
  },

  /**
   * V3: Validate order draft (for future use)
   */
  assertOrderNotEmpty(itemCount: number): void {
    if (itemCount === 0) {
      throw new BusinessError(
        "Order cannot be empty",
        400,
        "ORDER_EMPTY"
      )
    }
  },

  // ============================================================
  // STEP 7: STATE TRANSITION RULES
  // ============================================================

  /**
   * Check if state transition is valid
   */
  canTransition(current: OrderStatus, target: OrderStatus): boolean {
    const transitions = OrderStateTransitions as Record<OrderStatus, { canTransitionTo: readonly OrderStatus[] }>
    const allowed = transitions[current]?.canTransitionTo
    return allowed?.includes(target) ?? false
  },

  /**
   * Assert state transition is valid
   *
   * @throws BusinessError INVALID_STATE_TRANSITION
   */
  assertTransition(current: OrderStatus, target: OrderStatus): void {
    if (!this.canTransition(current, target)) {
      throw new BusinessError(
        `Cannot transition from ${current} to ${target}`,
        400,
        "INVALID_STATE_TRANSITION"
      )
    }
  },

  /**
   * Get valid next states from current state
   */
  getValidNextStates(current: OrderStatus): readonly OrderStatus[] {
    const transitions = OrderStateTransitions as Record<OrderStatus, { canTransitionTo: readonly OrderStatus[] }>
    return transitions[current]?.canTransitionTo ?? []
  },

  /**
   * Check if state is terminal (no further transitions possible)
   */
  isTerminalState(status: OrderStatus): boolean {
    const transitions = OrderStateTransitions as Record<OrderStatus, { canTransitionTo: readonly OrderStatus[] }>
    return transitions[status]?.canTransitionTo.length === 0
  },
} as const
