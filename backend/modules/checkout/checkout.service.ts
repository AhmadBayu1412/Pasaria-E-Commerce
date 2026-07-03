// ============================================================
// CHECKOUT SERVICE — Application Orchestrator
// Phase 4 Step 5: Checkout Orchestration Foundation
//
// Philosophy:
// - Application Service, NOT Domain Service
// - ONLY orchestrates, no business rules
// - Uses domain contracts, not internal entities
// - Let domains compute their own fields
// ============================================================

import { CartService } from "../cart/services/cart.service.js"
import { InventoryService } from "../inventory/inventory.service.js"
import { CheckoutRules } from "./checkout.rules.js"
import { BusinessError } from "../../shared/errors/business.error.js"
import type {
  InitiateCheckoutInput,
  CheckoutPreview,
} from "./checkout.types.js"

export const CheckoutService = {
  /**
   * Initiate Checkout — Application Orchestrator
   *
   * Workflow:
   * 1. Get cart snapshot through contract (Cart owns this data)
   * 2. Validate pre-condition (CheckoutRules)
   * 3. Validate each item through Inventory contract
   * 4. Aggregate results
   * 5. Build structured preview
   *
   * @throws BusinessError CART_EMPTY - Cart has no items
   * @throws BusinessError CHECKOUT_UNAVAILABLE_ITEMS - One or more items unavailable
   */
  async initiateCheckout(input: InitiateCheckoutInput): Promise<CheckoutPreview> {
    const { userId } = input

    // STEP 1: Get cart snapshot through contract
    const cartSnapshot = await CartService.getCartSnapshot(userId)

    // STEP 2: Validate pre-condition
    CheckoutRules.assertCartNotEmpty(cartSnapshot.totalQuantity)

    // STEP 3: Validate each item through Inventory contract
    const itemResults = await Promise.all(
      cartSnapshot.items.map(item =>
        InventoryService.validateCartItemForCheckout({
          productId: item.productId,
          quantity: item.quantity,
        })
      )
    )

    // STEP 4: Aggregate results
    const failedItems = itemResults
      .filter(r => r.status === "INVALID")
      .map(r => r.productId)

    const passed = failedItems.length === 0

    // STEP 5: If ANY item unavailable, throw (no partial checkout in Step 5)
    if (!passed) {
      throw new BusinessError(
        `Some items are unavailable: ${failedItems.join(", ")}`,
        400,
        "CHECKOUT_UNAVAILABLE_ITEMS"
      )
    }

    // STEP 6: Build structured preview
    return {
      summary: {
        cartId: cartSnapshot.cartId,
        userId: cartSnapshot.userId,
        totalQuantity: cartSnapshot.totalQuantity,
        isReady: true,
      },
      items: itemResults.map(r => ({
        productId: r.productId,
        quantity: r.requestedQuantity,
        availableStock: r.availableStock,
        status: r.status,
        reason: r.reason,
      })),
      validation: {
        passed: true,
        failedItems: [],
      },
    }
  },
} as const
