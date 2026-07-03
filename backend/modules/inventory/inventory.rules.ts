// ============================================================
// INVENTORY RULES (Pure Validation Only)
// Phase 4 Step 4: Inventory Foundation
//
// Rules ONLY validate. No database access.
// Service handles all queries.
// ============================================================

import { BusinessError } from "../../shared/errors/business.error.js"
import { BUSINESS_LIMITS } from "../../shared/config/business.config.js"

export const InventoryRules = {

  /**
   * V1: Validate quantity is within acceptable range
   */
  assertValidQuantity(quantity: number): void {
    if (quantity < 1) {
      throw new BusinessError(
        "Quantity must be at least 1",
        400,
        "INVALID_QUANTITY"
      )
    }

    if (quantity > BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY) {
      throw new BusinessError(
        `Quantity cannot exceed ${BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY}`,
        400,
        "QUANTITY_EXCEEDS_LIMIT"
      )
    }
  },

  /**
   * V2: Check if stock can fulfill request
   * Throws if insufficient stock
   */
  assertStockAvailable(availableStock: number, quantity: number): void {
    this.assertValidQuantity(quantity)

    if (quantity > availableStock) {
      throw new BusinessError(
        `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
        400,
        "INSUFFICIENT_STOCK"
      )
    }
  },
}
