// ============================================================
// ORDER SERVICE — Domain Service
// Phase 4 Step 6: Order Draft Foundation
//
// Philosophy:
// - Order is a HISTORICAL RECORD
// - Order does NOT query Product after creation
// - Simple create, no database transaction (Step 7 scope)
// ============================================================

import { prisma } from "../../infra/db/prisma.js"
import { OrderRules } from "./order.rules.js"
import { OrderMapper } from "./order.mapper.js"
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
      .filter(item => item.status === "VALID")

    const orderItems: ReadonlyArray<OrderItemData> = validItems
      .map(item => OrderMapper.toOrderItemData(item))

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
          create: orderItems.map(item => ({
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
} as const
