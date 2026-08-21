// ============================================================
// INVENTORY SERVICE (Internal Use Only)
// Phase 4 Step 4: Inventory Foundation
// Phase 4 Step 7: Add reserveStockTx() for atomic transactions
//
// Philosophy:
// - Throw on failure (consistent with Cart pattern)
// - Returns product data for Step 5 (Checkout)
// - reserveStockTx: Domain operation, does NOT know about Order/Checkout
// ============================================================

import { prisma } from "../../infra/db/prisma"
import { InventoryRules } from "./inventory.rules"
import { BusinessError } from "../../shared/errors/business.error"
import type { Prisma } from "@prisma/client"
import type {
  ValidateStockInput,
  ValidateStockResult,
  ValidateCartItemForCheckoutInput,
  ValidateCartItemForCheckoutResult,
  ReserveStockInput,
  ReserveStockResult,
  ReleaseStockInput,
  ReleaseStockResult,
} from "./inventory.types"

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

  // ============================================================
  // STEP 7: RESERVE STOCK FOR TRANSACTION
  // ============================================================

  /**
   * Reserve Stock — Inside Transaction
   *
   * Domain operation only. Does NOT know about Order, Checkout, or Payment.
   * This is purely an inventory domain operation.
   *
   * Algorithm:
   * 1. Check product exists
   * 2. Validate sufficient stock
   * 3. Decrement availableStock (atomic within transaction)
   *
   * @param tx - Prisma.TransactionClient (REQUIRED)
   * @param input - ReserveStockInput with productId + quantity
   * @returns ReserveStockResult
   *
   * @throws BusinessError PRODUCT_NOT_FOUND
   * @throws BusinessError INSUFFICIENT_STOCK
   */
  async reserveStockTx(
    tx: Prisma.TransactionClient,
    input: ReserveStockInput
  ): Promise<ReserveStockResult> {
    const { productId, quantity } = input

    // 1. Get product with current stock
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, availableStock: true },
    })

    if (!product) {
      throw new BusinessError("Product not found", 404, "PRODUCT_NOT_FOUND")
    }

    // 2. Validate sufficient stock
    InventoryRules.assertStockAvailable(product.availableStock, quantity)

    // 3. Decrement availableStock atomically
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        availableStock: {
          decrement: quantity,
        },
      },
      select: {
        id: true,
        availableStock: true,
      },
    })

    return {
      productId: updated.id,
      reservedQuantity: quantity,
      remainingStock: updated.availableStock,
    }
  },

  /**
   * Reserve Stock — Standalone (for testing)
   *
   * Uses global prisma client instead of transaction.
   */
  async reserveStock(input: ReserveStockInput): Promise<ReserveStockResult> {
    const { productId, quantity } = input

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, availableStock: true },
    })

    if (!product) {
      throw new BusinessError("Product not found", 404, "PRODUCT_NOT_FOUND")
    }

    InventoryRules.assertStockAvailable(product.availableStock, quantity)

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        availableStock: {
          decrement: quantity,
        },
      },
      select: {
        id: true,
        availableStock: true,
      },
    })

    return {
      productId: updated.id,
      reservedQuantity: quantity,
      remainingStock: updated.availableStock,
    }
  },

  /**
   * Release Stock — Inside Transaction
   *
   * Returns reserved stock back to available inventory.
   * Called when order is cancelled or expired.
   *
   * @param tx - Prisma.TransactionClient (REQUIRED)
   * @param input - ReleaseStockInput with productId + quantity
   * @returns ReleaseStockResult
   */
  async releaseStockTx(
    tx: Prisma.TransactionClient,
    input: ReleaseStockInput
  ): Promise<ReleaseStockResult> {
    const { productId, quantity } = input;

    // 1. Get product to verify it exists
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, availableStock: true },
    });

    if (!product) {
      throw new BusinessError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    // 2. Increment availableStock (return reserved stock)
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        availableStock: {
          increment: quantity,
        },
      },
      select: {
        id: true,
        availableStock: true,
      },
    });

    return {
      productId: updated.id,
      releasedQuantity: quantity,
      currentStock: updated.availableStock,
    };
  },
} as const
