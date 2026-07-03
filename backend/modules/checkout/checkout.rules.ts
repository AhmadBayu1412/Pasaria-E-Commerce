// ============================================================
// CHECKOUT RULES (Pure Validation Only)
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 7: Checkout Completion Rules
//
// Philosophy:
// - ONLY pre-condition checks
// - NO business rules (that's domain responsibility)
// - NO database access
// ============================================================

import { BusinessError } from "../../shared/errors/business.error.js"
import type { CheckoutPreview } from "./checkout.types.js"

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

  // ============================================================
  // STEP 7: CHECKOUT COMPLETION RULES
  // ============================================================

  /**
   * V2: Checkout preview must be valid for completion
   */
  assertPreviewValidForCompletion(preview: CheckoutPreview): void {
    if (!preview.validation.passed) {
      throw new BusinessError(
        "Checkout preview is not valid. Some items are unavailable.",
        400,
        "CHECKOUT_NOT_VALID"
      )
    }
  },

  /**
   * V3: Cart must exist for checkout completion
   */
  assertCartExists(cartId: number | null): void {
    if (cartId === null) {
      throw new BusinessError(
        "Cart not found",
        404,
        "CART_NOT_FOUND"
      )
    }
  },
} as const
