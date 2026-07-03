// ============================================================
// ORDER RULES (Pure Validation Only)
// Phase 4 Step 6: Order Draft Foundation
//
// Philosophy:
// - ONLY pre-condition checks
// - NO business logic (that's service responsibility)
// - NO database access
// ============================================================

import { BusinessError } from "../../shared/errors/business.error.js"
import type { CheckoutPreview } from "../checkout/checkout.types.js"

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
    const validItems = preview.items.filter(item => item.status === "VALID")
    
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
} as const
