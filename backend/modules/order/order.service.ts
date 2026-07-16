// ============================================================
// ORDER SERVICE — Domain Service
// Phase 4 Step 6: Order Draft Foundation
// Phase 4 Step 7: Add createDraftTx() for atomic transactions
// Phase 5 Step 1: Updated with financial fields and status filter
//
// Philosophy:
// - Order is a HISTORICAL RECORD
// - Order does NOT query Product after creation
// - createDraftTx: Accepts transaction client for atomic operations
// ============================================================

import { prisma } from '../../infra/db/prisma.js';
import { OrderRules } from './order.rules.js';
import { OrderMapper } from './order.mapper.js';
import type { Prisma } from '@prisma/client';
import type {
  CreateDraftInput,
  OrderDraft,
  OrderItemData,
} from './order.types.js';
import type { OrderStatus } from './order-lifecycle.types.js';

export const OrderService = {
  /**
   * Create Draft — Order Domain Service
   *
   * Creates Order + OrderItems from Checkout Preview.
   * Order accepts COMPLETE preview - does NOT query Product.
   */
  async createDraft(input: CreateDraftInput): Promise<OrderDraft> {
    const { checkoutPreview } = input;

    // STEP 1: Validate preview is ready
    OrderRules.assertPreviewValid(checkoutPreview);
    OrderRules.assertPreviewHasItems(checkoutPreview);

    // STEP 2: Map preview items to order items (simple transform)
    const validItems = checkoutPreview.items.filter(
      (item) => item.status === 'VALID'
    );

    const orderItems: ReadonlyArray<OrderItemData> = validItems.map((item) =>
      OrderMapper.toOrderItemData(item)
    );

    // STEP 3: Calculate totals
    const totals = OrderMapper.calculateTotals(orderItems);

    // STEP 4: Calculate financial fields from checkout
    const shippingFee = checkoutPreview.shipping?.fee ?? 0;
    const tax = checkoutPreview.summary.tax ?? 0;
    const total = totals.subtotal + shippingFee + tax;

    // STEP 5: Get shipping info
    const shipping = checkoutPreview.shipping;

    // STEP 6: Create Order + OrderItems
    const order = await prisma.order.create({
      data: {
        userId: checkoutPreview.summary.userId,
        status: 'DRAFT',
        totalQuantity: totals.totalQuantity,
        totalItemCount: totals.totalItemCount,
        subtotal: totals.subtotal,
        // 💰 FINANCIAL FIELDS
        shippingFee,
        tax,
        total,
        // 📍 SHIPPING INFO (from checkout)
        shippingName: shipping?.recipientName,
        shippingPhone: shipping?.phone,
        shippingAddress: shipping?.address,
        shippingCity: shipping?.city,
        shippingPostalCode: shipping?.postalCode,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            productImage: item.productImage,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // STEP 7: Return draft
    return OrderMapper.toOrderDraft(order);
  },

  /**
   * Create Draft — Inside Transaction
   *
   * Creates Order + OrderItems within an existing transaction.
   */
  async createDraftTx(
    tx: Prisma.TransactionClient,
    input: CreateDraftInput
  ): Promise<OrderDraft> {
    const { checkoutPreview } = input;

    // STEP 1: Validate preview is ready
    OrderRules.assertPreviewValid(checkoutPreview);
    OrderRules.assertPreviewHasItems(checkoutPreview);

    // STEP 2: Map preview items to order items (simple transform)
    const validItems = checkoutPreview.items.filter(
      (item) => item.status === 'VALID'
    );

    const orderItems: ReadonlyArray<OrderItemData> = validItems.map((item) =>
      OrderMapper.toOrderItemData(item)
    );

    // STEP 3: Calculate totals
    const totals = OrderMapper.calculateTotals(orderItems);

    // STEP 4: Calculate financial fields from checkout
    const shippingFee = checkoutPreview.shipping?.fee ?? 0;
    const tax = checkoutPreview.summary.tax ?? 0;
    const total = totals.subtotal + shippingFee + tax;

    // STEP 5: Get shipping info
    const shipping = checkoutPreview.shipping;

    // STEP 6: Create Order + OrderItems using transaction client
    const order = await tx.order.create({
      data: {
        userId: checkoutPreview.summary.userId,
        status: 'DRAFT',
        totalQuantity: totals.totalQuantity,
        totalItemCount: totals.totalItemCount,
        subtotal: totals.subtotal,
        // 💰 FINANCIAL FIELDS
        shippingFee,
        tax,
        total,
        // 📍 SHIPPING INFO (from checkout)
        shippingName: shipping?.recipientName,
        shippingPhone: shipping?.phone,
        shippingAddress: shipping?.address,
        shippingCity: shipping?.city,
        shippingPostalCode: shipping?.postalCode,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            productImage: item.productImage,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // STEP 7: Return draft
    return OrderMapper.toOrderDraft(order);
  },

  /**
   * Get Order by ID
   */
  async getOrder(orderId: number): Promise<OrderDraft | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return null;
    }

    return OrderMapper.toOrderDraft(order);
  },

  /**
   * Get Orders by User ID
   *
   * @param userId - User ID
   * @param options - Optional filter options
   * @param options.status - Filter by status or statuses
   */
  async getOrdersByUser(
    userId: number,
    options?: {
      status?: OrderStatus | readonly OrderStatus[];
    }
  ): Promise<ReadonlyArray<OrderDraft>> {
    // Build where clause
    const whereClause: Prisma.OrderWhereInput = {
      userId,
    };

    // Apply status filter if provided
    if (options?.status) {
      // @ts-expect-error - Type compatibility with Prisma enum
      whereClause.status = options.status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => OrderMapper.toOrderDraft(order));
  },
} as const;
