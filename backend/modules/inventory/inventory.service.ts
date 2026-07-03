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
} as const
