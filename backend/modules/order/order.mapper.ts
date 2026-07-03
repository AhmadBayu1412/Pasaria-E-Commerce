// ============================================================
// ORDER MAPPER
// Phase 4 Step 6: Order Draft Foundation
//
// Philosophy:
// - Mapper only TRANSFORMS data
// - Mapper does NOT contain business logic
// - Mapper does NOT query database
// ============================================================

import type {
  CheckoutPreview,
  CheckoutItemPreview,
} from "../checkout/checkout.types.js"
import type {
  OrderItemData,
  OrderTotals,
  OrderDraft,
  OrderItemSnapshot,
} from "./order.types.js"
import type { OrderWithItems } from "./order.types.js"

export const OrderMapper = {
  /**
   * Transform CheckoutItemPreview → OrderItemData
   * Simple data transformation, no query
   */
  toOrderItemData(item: CheckoutItemPreview): OrderItemData {
    return {
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }
  },

  /**
   * Calculate totals from order items
   * Simple aggregation, no business rules
   */
  calculateTotals(items: ReadonlyArray<OrderItemData>): OrderTotals {
    return {
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      totalItemCount: items.length,
      subtotal: items.reduce((sum, i) => sum + i.subtotal, 0),
    }
  },

  /**
   * Transform Prisma Order → OrderDraft
   * Used for API response
   */
  toOrderDraft(order: OrderWithItems): OrderDraft {
    const items: ReadonlyArray<OrderItemSnapshot> = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    }))

    return {
      id: order.id,
      userId: order.userId,
      status: order.status as "DRAFT",
      items,
      totalQuantity: order.totalQuantity,
      totalItemCount: order.totalItemCount,
      subtotal: Number(order.subtotal),
      createdAt: order.createdAt,
    }
  },
} as const
