// ============================================================
// ORDER SERVICE — Domain Service
// Phase 4 Step 6: Order Draft Foundation
// Phase 4 Step 7: Add createDraftTx() for atomic transactions
//
// Philosophy:
// - Order is a HISTORICAL RECORD
// - Order does NOT query Product after creation
// - createDraftTx: Accepts transaction client for atomic operations
// ============================================================

import { prisma } from "../../infra/db/prisma.js"
import { OrderRules } from "./order.rules.js"
import { OrderMapper } from "./order.mapper.js"
import type { Prisma } from "@prisma/client"
import type {
  CreateDraftInput,
  OrderDraft,
  OrderItemData,
} from "./order.types.js"

export const OrderService = {
  /**
   * Create Draft — Order Domain Service
   *
   * Creates Order + OrderItems from Checkout Preview.
   * Order accepts COMPLETE preview - does NOT query Product.
   *
   * @param input.checkoutPreview - Complete preview from CheckoutService
   * @returns OrderDraft
   *
   * @throws BusinessError CHECKOUT_NOT_VALID
   * @throws BusinessError ORDER_EMPTY
   */
  async createDraft(input: CreateDraftInput): Promise<OrderDraft> {
    const { checkoutPreview } = input

    // STEP 1: Validate preview is ready
    OrderRules.assertPreviewValid(checkoutPreview)
    OrderRules.assertPreviewHasItems(checkoutPreview)

    // STEP 2: Map preview items to order items (simple transform)
    const validItems = checkoutPreview.items
      .filter((item) => item.status === "VALID")

    const orderItems: ReadonlyArray<OrderItemData> = validItems
      .map((item) => OrderMapper.toOrderItemData(item))

    // STEP 3: Calculate totals
    const totals = OrderMapper.calculateTotals(orderItems)

    // STEP 4: Create Order + OrderItems
    // NOTE: Prisma's nested create is atomic for this single aggregate
    // Cross-domain transaction (Order + Inventory) is Step 7 scope
    const order = await prisma.order.create({
      data: {
        userId: checkoutPreview.summary.userId,
        status: "DRAFT",
        totalQuantity: totals.totalQuantity,
        totalItemCount: totals.totalItemCount,
        subtotal: totals.subtotal,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // STEP 5: Return draft
    return OrderMapper.toOrderDraft(order)
  },

  // ============================================================
  // STEP 7: CREATE DRAFT WITH TRANSACTION
  // ============================================================

  /**
   * Create Draft — Inside Transaction
   *
   * Creates Order + OrderItems within an existing transaction.
   * Used by CheckoutService.completeCheckout() for atomic operations.
   *
   * @param tx - Prisma.TransactionClient (REQUIRED)
   * @param input - CreateDraftInput with checkoutPreview
   * @returns OrderDraft
   *
   * @throws BusinessError CHECKOUT_NOT_VALID
   * @throws BusinessError ORDER_EMPTY
   */
  async createDraftTx(
    tx: Prisma.TransactionClient,
    input: CreateDraftInput
  ): Promise<OrderDraft> {
    const { checkoutPreview } = input

    // STEP 1: Validate preview is ready
    OrderRules.assertPreviewValid(checkoutPreview)
    OrderRules.assertPreviewHasItems(checkoutPreview)

    // STEP 2: Map preview items to order items (simple transform)
    const validItems = checkoutPreview.items
      .filter((item) => item.status === "VALID")

    const orderItems: ReadonlyArray<OrderItemData> = validItems
      .map((item) => OrderMapper.toOrderItemData(item))

    // STEP 3: Calculate totals
    const totals = OrderMapper.calculateTotals(orderItems)

    // STEP 4: Create Order + OrderItems using transaction client
    const order = await tx.order.create({
      data: {
        userId: checkoutPreview.summary.userId,
        status: "DRAFT",
        totalQuantity: totals.totalQuantity,
        totalItemCount: totals.totalItemCount,
        subtotal: totals.subtotal,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // STEP 5: Return draft
    return OrderMapper.toOrderDraft(order)
  },

  /**
   * Get Order by ID
   *
   * @param orderId - Order ID
   * @returns OrderDraft | null
   */
  async getOrder(orderId: number): Promise<OrderDraft | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      return null
    }

    return OrderMapper.toOrderDraft(order)
  },

  /**
   * Get Orders by User ID
   *
   * @param userId - User ID
   * @returns ReadonlyArray<OrderDraft>
   */
  async getOrdersByUser(userId: number): Promise<ReadonlyArray<OrderDraft>> {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    })

    return orders.map((order) => OrderMapper.toOrderDraft(order))
  },
} as const
