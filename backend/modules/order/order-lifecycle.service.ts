// ============================================================
// ORDER LIFECYCLE SERVICE
// Phase 5 Step 1: Single Entry Point
//
// Philosophy:
// - SINGLE ENTRY POINT for ALL status changes
// - No other service may directly update order status
// - Validates using OrderLifecycleRules before any change
// - INTERNAL generic transition, exposed via intention-revealing methods
// - NO trigger types (future steps add their own)
// - NO timeout logic (Step 8)
// ============================================================

import { prisma } from '../../infra/db/prisma.js';
import { OrderLifecycleRules } from './order-lifecycle.rules.js';
import { OrderMapper } from './order.mapper.js';
import { BusinessError } from '../../shared/errors/business.error.js';
import type { OrderStatus } from './order-lifecycle.types.js';
import type { OrderDraft } from './order.types.js';

/**
 * Minimal result - only the updated order
 * Future steps may extend with more context when needed
 */
export interface TransitionResult {
  readonly order: OrderDraft;
}

// ----- Service Interface -----
export const OrderLifecycleService = {
  /**
   * INTERNAL: Generic transition - validates and executes status change
   * 
   * NOTE: This is intentionally internal (prefixed with _ in spirit).
   * Future steps will expose intention-revealing methods instead of direct status.
   * 
   * @internal
   */
  async _transition(
    orderId: number,
    targetStatus: OrderStatus,
  ): Promise<TransitionResult> {
    // STEP 1: Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new BusinessError(
        `Order ${orderId} not found`,
        404,
        'ORDER_NOT_FOUND',
      );
    }

    const currentStatus = order.status as OrderStatus;

    // STEP 2: Validate transition
    if (!OrderLifecycleRules.canTransition(currentStatus, targetStatus)) {
      const allowed = OrderLifecycleRules.getValidNextStates(currentStatus);
      throw new BusinessError(
        `Cannot transition from ${currentStatus} to ${targetStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
        400,
        'TRANSITION_INVALID',
      );
    }

    // STEP 3: Execute transition
    await prisma.order.update({
      where: { id: orderId },
      data: { status: targetStatus },
    });

    // STEP 4: Fetch updated order
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    // STEP 5: Return result (minimal - just order)
    return {
      order: OrderMapper.toOrderDraft(updatedOrder!),
    };
  },

  /**
   * Get current order status
   */
  async getStatus(orderId: number): Promise<OrderStatus | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    return order?.status as OrderStatus | null;
  },
} as const;
