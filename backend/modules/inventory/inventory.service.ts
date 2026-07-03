// ============================================================
// INVENTORY SERVICE (Internal Use Only)
// Phase 4 Step 4: Inventory Foundation
//
// Philosophy:
// - Throw on failure (consistent with Cart pattern)
// - Returns product data for Step 5 (Checkout)
// - No mutation - reserve/release comes in Step 5
// ============================================================

import { prisma } from "../../infra/db/prisma.js"
import { InventoryRules } from "./inventory.rules.js"
import { BusinessError } from "../../shared/errors/business.error.js"
import type {
  ValidateStockInput,
  ValidateStockResult,
  ValidateCartItemForCheckoutInput,
  ValidateCartItemForCheckoutResult,
} from "./inventory.types.js"

export const InventoryService = {

  /**
   * Validate Stock Availability
   *
   * The ONLY public behavior in Step 4.
   * Returns product data so caller (Checkout in Step 5) doesn't need to query again.
   *
   * @throws PRODUCT_NOT_FOUND - Product does not exist
   * @throws INSUFFICIENT_STOCK - Stock cannot fulfill request
   * @throws QUANTITY_EXCEEDS_LIMIT - Quantity exceeds maximum
   */
  async validateStock(input: ValidateStockInput): Promise<ValidateStockResult> {
    const { productId, quantity } = input

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, availableStock: true },
    })

    if (!product) {
      throw new BusinessError("Product not found", 404, "PRODUCT_NOT_FOUND")
    }

    InventoryRules.assertStockAvailable(product.availableStock, quantity)

    return {
      productId: product.id,
      availableStock: product.availableStock,
    }
  },

  // ============================================================
  // STEP 5: VALIDATE CART ITEM FOR CHECKOUT (Application Service Use)
  // ============================================================

  /**
   * Validate Cart Item for Checkout — Application Service Use
   *
   * Returns result with status instead of throwing.
   * This allows Application Service to aggregate results without exception handling.
   *
   * Key Differences from validateStock():
   * - Returns status + reason instead of throwing
   * - No BusinessError thrown
   * - For cross-boundary (Application) use only
   *
   * NOTE: validateStock() still throws for domain-internal use
   */
  async validateCartItemForCheckout(
    input: ValidateCartItemForCheckoutInput
  ): Promise<ValidateCartItemForCheckoutResult> {
    const { productId, quantity } = input

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, availableStock: true },
    })

    if (!product) {
      return {
        productId,
        requestedQuantity: quantity,
        availableStock: 0,
        status: "INVALID",
        reason: "PRODUCT_NOT_FOUND",
      }
    }

    if (quantity > product.availableStock) {
      return {
        productId,
        requestedQuantity: quantity,
        availableStock: product.availableStock,
        status: "INVALID",
        reason: "OUT_OF_STOCK",
      }
    }

    return {
      productId,
      requestedQuantity: quantity,
      availableStock: product.availableStock,
      status: "VALID",
      reason: undefined,
    }
  },
} as const
