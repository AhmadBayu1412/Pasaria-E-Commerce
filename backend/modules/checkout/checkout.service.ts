// ============================================================
// CHECKOUT SERVICE — Application Orchestrator
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 6: Include Product Query for Snapshot
//
// Philosophy:
// - Application Service, NOT Domain Service
// - ONLY orchestrates, no business rules
// - Uses domain contracts, not internal entities
// - Let domains compute their own fields
// ============================================================

import { CartService } from "../cart/services/cart.service.js"
import { InventoryService } from "../inventory/inventory.service.js"
import { getProductForSnapshot } from "../product/services/product.service.js"
import { CheckoutRules } from "./checkout.rules.js"
import { BusinessError } from "../../shared/errors/business.error.js"
import type { Decimal } from "@prisma/client/runtime/library"
import type {
  InitiateCheckoutInput,
  CheckoutPreview,
} from "./checkout.types.js"

export const CheckoutService = {
  /**
   * Initiate Checkout — Application Orchestrator
   *
   * Phase 6: Now collects complete snapshot data including Product info
   * 
   * Workflow:
   * 1. Get cart snapshot through contract (Cart owns this data)
   * 2. Validate pre-condition (CheckoutRules)
   * 3. Validate each item AND get product info (parallel)
   * 4. Aggregate results
   * 5. Calculate totals
   * 6. If any item unavailable, throw
   * 7. Build structured preview
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

    // STEP 3: Validate each item AND get product info in parallel
    const itemResults = await Promise.all(
      cartSnapshot.items.map(async (item) => {
        // Validate stock
        const stockResult = await InventoryService.validateCartItemForCheckout({
          productId: item.productId,
          quantity: item.quantity,
        })

        // Get product info for snapshot (NEW in Step 6)
        const product = await getProductForSnapshot(item.productId)
        
        // Convert Decimal to number for API
        const unitPriceNum = Number(product.basePrice)
        const subtotalNum = unitPriceNum * item.quantity

        return {
          productId: item.productId,
          productName: product.name,
          unitPrice: unitPriceNum,
          quantity: item.quantity,
          availableStock: stockResult.availableStock,
          subtotal: subtotalNum,
          status: stockResult.status,
          reason: stockResult.reason,
        }
      })
    )

    // STEP 4: Aggregate results
    const failedItems = itemResults
      .filter(r => r.status === "INVALID")
      .map(r => r.productId)

    const passed = failedItems.length === 0

    // STEP 5: Calculate totals (use number for simplicity)
    const totalQuantity = itemResults.reduce((sum, i) => sum + i.quantity, 0)
    const totalItemCount = itemResults.length
    const subtotal = itemResults.reduce((sum, i) => sum + Number(i.subtotal), 0)

    // STEP 6: If ANY item unavailable, throw (no partial checkout)
    if (!passed) {
      throw new BusinessError(
        `Some items are unavailable: ${failedItems.join(", ")}`,
        400,
        "CHECKOUT_UNAVAILABLE_ITEMS"
      )
    }

    // STEP 7: Build structured preview
    return {
      summary: {
        cartId: cartSnapshot.cartId,
        userId: cartSnapshot.userId,
        totalQuantity,
        totalItemCount,
        subtotal,
        isReady: true,
      },
      items: itemResults.map(r => ({
        productId: r.productId,
        productName: r.productName,
        unitPrice: r.unitPrice,
        quantity: r.quantity,
        availableStock: r.availableStock,
        subtotal: r.subtotal,
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
