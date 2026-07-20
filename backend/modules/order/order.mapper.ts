// ============================================================
// ORDER MAPPER
// Phase 4 Step 6: Order Draft Foundation
// Phase 5 Step 1: Added financial fields
//
// Philosophy:
// - Mapper only TRANSFORMS data
// - Mapper does NOT contain business logic
// - Mapper does NOT query database
// ============================================================

import type {
  CheckoutItemPreview,
  CheckoutPreview,
} from '../checkout/checkout.types.js';
import type {
  OrderItemData,
  OrderTotals,
  OrderDraft,
  OrderItemSnapshot,
} from './order.types.js';
import type { OrderWithItems } from './order.types.js';
import type { OrderStatus } from './order-lifecycle.types.js';

// Extended order type with new fields (after schema update)
interface ExtendedOrderFields {
  shippingFee: unknown;
  tax: unknown;
  total: unknown;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
}

// Map Prisma's 'tax' field to frontend's 'adminFee' concept
// This maintains backward compatibility with Prisma schema while providing clear naming for frontend

export const OrderMapper = {
  /**
   * Transform CheckoutItemPreview → OrderItemData
   * Simple data transformation, no query
   */
  toOrderItemData(item: CheckoutItemPreview): OrderItemData {
    return {
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    };
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
    };
  },

  /**
   * Transform Prisma Order → OrderDraft
   * Used for API response
   */
  toOrderDraft(order: OrderWithItems): OrderDraft {
    const items: ReadonlyArray<OrderItemSnapshot> = order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: (item as any).productImage || null,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    }));

    // Cast to extended order to access new fields
    const extendedOrder = order as unknown as ExtendedOrderFields;

    return {
      id: order.id,
      userId: order.userId,
      status: order.status as OrderStatus,
      items,
      totalQuantity: order.totalQuantity,
      totalItemCount: order.totalItemCount,
      subtotal: Number(order.subtotal),
      shippingFee: Number(extendedOrder.shippingFee),
      adminFee: Number(extendedOrder.tax), // tax field in DB = adminFee in frontend
      total: Number(extendedOrder.total),
      shippingName: extendedOrder.shippingName ?? undefined,
      shippingPhone: extendedOrder.shippingPhone ?? undefined,
      shippingAddress: extendedOrder.shippingAddress ?? undefined,
      shippingCity: extendedOrder.shippingCity ?? undefined,
      shippingPostalCode: extendedOrder.shippingPostalCode ?? undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  },
} as const;
