// ============================================================
// CHECKOUT SERVICE — Application Orchestrator
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 6: Include Product Query for Snapshot
// Phase 4 Step 7: Complete Checkout with Transaction
// Phase 4 Step 8: Background Jobs Integration
//
// Philosophy:
// - Application Service, NOT Domain Service
// - ONLY orchestrates, no business rules
// - Uses domain contracts, not internal entities
// - Let domains compute their own fields
// - SOLE TRANSACTION OWNER (Step 7)
// - POST-COMMIT QUEUE ENQUEUE (Step 8)
// ============================================================

import { prisma } from "../../infra/db/prisma.js"
import { CartService } from "../cart/services/cart.service.js"
import { InventoryService } from "../inventory/inventory.service.js"
import { getProductForSnapshot } from "../product/services/product.service.js"
import { CheckoutRules } from "./checkout.rules.js"
import { OrderService } from "../order/order.service.js"
import { BusinessError } from "../../shared/errors/business.error.js"
import { CheckoutQueueProducer } from "../../infra/queue/checkout.producer.js"
import type {
  InitiateCheckoutInput,
  CheckoutPreview,
  CompleteCheckoutInput,
  CompleteCheckoutResult,
} from "./checkout.types.js"

// ----- Shipping Options (mirrored from shipping.controller.ts) -----
const SHIPPING_OPTIONS: Array<{ id: string; name: string; price: number }> = [
  { id: "jne_reg", name: "JNE Regular", price: 15000 },
  { id: "jne_yes", name: "JNE YES", price: 35000 },
  { id: "pos_kilat", name: "Pos Kilat", price: 20000 },
  { id: "tiki_reg", name: "TIKI Regular", price: 18000 },
  { id: "grab_express", name: "GrabExpress", price: 25000 },
]

// ----- Payment Methods (mirrored from payment-methods.controller.ts) -----
const PAYMENT_METHODS: Array<{ id: string; name: string; fee: number }> = [
  { id: "bca_va", name: "BCA Virtual Account", fee: 4000 },
  { id: "mandiri_va", name: "Mandiri Virtual Account", fee: 4000 },
  { id: "bni_va", name: "BNI Virtual Account", fee: 4000 },
  { id: "bri_va", name: "BRI Virtual Account", fee: 4000 },
  { id: "gopay", name: "GoPay", fee: 2000 },
  { id: "ovo", name: "OVO", fee: 2000 },
  { id: "dana", name: "DANA", fee: 2000 },
  { id: "credit_card", name: "Kartu Kredit", fee: 2.9 }, // percentage-based
  { id: "indomaret", name: "Indomaret", fee: 2500 },
  { id: "alfamart", name: "Alfamart", fee: 2500 },
  { id: "qris", name: "QRIS", fee: 0 },
]

/**
 * Get shipping option by ID
 */
function getShippingOption(shippingId?: string) {
  if (!shippingId) return null
  return SHIPPING_OPTIONS.find((s) => s.id === shippingId) || null
}

/**
 * Get payment method by ID
 */
function getPaymentMethod(paymentId?: string) {
  if (!paymentId) return null
  return PAYMENT_METHODS.find((p) => p.id === paymentId) || null
}

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
          productImage: product.imageUrl,
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
      .filter((r) => r.status === "INVALID")
      .map((r) => r.productId)

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
      items: itemResults.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        productImage: r.productImage,
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

  // ============================================================
  // STEP 7: COMPLETE CHECKOUT — SOLE TRANSACTION ORCHESTRATOR
  // STEP 8: POST-COMMIT QUEUE ENQUEUE
  // ============================================================

  /**
   * Complete Checkout — Sole Transaction Orchestrator
   *
   * This is the ONLY place where cross-domain transaction is opened.
   * All other services just receive the transaction client.
   *
   * After commit, jobs are enqueued to BullMQ for:
   * - Order confirmation email
   * - Audit log creation
   *
   * Responsibilities:
   * 1. Get checkout preview (validates cart + inventory)
   * 2. Open transaction
   * 3. Coordinate Order + Inventory + Cart
   * 4. Handle commit/rollback
   * 5. Enqueue post-commit jobs (Step 8) - FIRE AND FORGET
   *
   * @param input - CompleteCheckoutInput with userId
   * @returns CompleteCheckoutResult
   *
   * @throws BusinessError CART_EMPTY
   * @throws BusinessError CHECKOUT_NOT_VALID
   * @throws BusinessError CHECKOUT_UNAVAILABLE_ITEMS
   * @throws BusinessError INSUFFICIENT_STOCK
   * @throws BusinessError CART_NOT_FOUND
   */
  async completeCheckout(input: CompleteCheckoutInput): Promise<CompleteCheckoutResult> {
    const { userId, selectedShippingId, selectedPaymentId } = input

    // STEP 1: Get checkout preview (validates cart + inventory)
    const preview = await this.initiateCheckout({ userId })

    // STEP 2: Validate for completion
    CheckoutRules.assertPreviewValidForCompletion(preview)
    CheckoutRules.assertCartExists(preview.summary.cartId)

    // STEP 3: Get shipping and payment fees
    const shippingOption = getShippingOption(selectedShippingId)
    const paymentMethod = getPaymentMethod(selectedPaymentId)
    const shippingFee = shippingOption?.price ?? 0
    const adminFee = paymentMethod?.fee ?? 0

    // Record transaction start time for audit
    const transactionStartTime = Date.now()

    // STEP 4: Execute in transaction
    // NOTE: This is the ONLY place where prisma.$transaction is called
    const result = await prisma.$transaction(async (tx) => {
      // 4a. Create order draft (uses tx) - pass shipping fee and admin fee
      const order = await OrderService.createDraftTx(tx, {
        checkoutPreview: preview,
        shippingFee,
        adminFee,
      })

      // 3b. Reserve inventory for each item (uses tx)
      // This validates stock and decrements availableStock atomically
      for (const item of preview.items) {
        await InventoryService.reserveStockTx(tx, {
          productId: item.productId,
          quantity: item.quantity,
        })
      }

      // 3c. Clear cart (uses tx)
      const cartCleared = await CartService.clearCartTx(tx, {
        userId,
        cartId: preview.summary.cartId!,
      })

      return {
        order,
        cartCleared,
      }
    })

    // ============================================================
    // STEP 8: POST-COMMIT OPERATIONS
    // These operations happen AFTER transaction commits
    // They are FIRE-AND-FORGET - checkout succeeds even if these fail
    // ============================================================

    // Get user email for email job
    // In production, this would come from user service
    const userEmail = `user-${userId}@example.com`

    // Enqueue order confirmation email (fire-and-forget)
    void CheckoutQueueProducer.enqueueOrderConfirmationEmail({
      orderId: result.order.id,
      userId,
      email: userEmail,
      template: "order_confirmation",
      data: {
        orderId: result.order.id,
        totalAmount: result.order.subtotal,
        itemCount: result.order.totalItemCount,
      },
    }).catch((err) => {
      console.error("[CHECKOUT] Failed to enqueue email job:", err)
    })

    // Enqueue audit log (fire-and-forget)
    void CheckoutQueueProducer.enqueueAuditLog({
      orderId: result.order.id,
      userId,
      action: "ORDER_CONFIRMED",
      metadata: {
        totalAmount: result.order.subtotal,
        itemCount: result.order.totalItemCount,
        transactionTimeMs: Date.now() - transactionStartTime,
      },
    }).catch((err) => {
      console.error("[CHECKOUT] Failed to enqueue audit job:", err)
    })

    // STEP 5: Return result
    // Note: Queue jobs are enqueued but not awaited
    // Checkout succeeds even if queue operations fail
    return {
      orderId: result.order.id,
      status: result.order.status as "DRAFT",
      totalQuantity: result.order.totalQuantity,
      totalItemCount: result.order.totalItemCount,
      subtotal: result.order.subtotal,
      shippingFee,
      adminFee,
      total: result.order.total,
      createdAt: result.order.createdAt,
    }
  },
} as const
