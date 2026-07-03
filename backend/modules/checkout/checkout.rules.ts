// ============================================================
// CHECKOUT RULES (Pure Validation Only)
// Phase 4 Step 5: Checkout Orchestration Foundation
//
// Philosophy:
// - ONLY pre-condition checks
// - NO business rules (that's domain responsibility)
// - NO database access
// ============================================================

import { BusinessError } from "../../shared/errors/business.error.js"

export const CheckoutRules = {
  /**
   * V1: Cart must have at least one item
   *
   * This is the ONLY rule for Step 5.
   * All other validations (stock, product existence) are
   * handled by their respective domain services.
   */
  assertCartNotEmpty(totalQuantity: number): void {
    if (totalQuantity === 0) {
      throw new BusinessError(
        "Cart is empty",
        400,
        "CART_EMPTY"
      )
    }
  },
} as const
