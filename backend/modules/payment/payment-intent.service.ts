// ============================================================
// PAYMENT INTENT SERVICE
// Phase 5 Step 3: Create Payment Intent
//
// Philosophy:
// - Use Case, not CRUD
// - NO Gateway communication
// - Transaction Safety: Both Order and Payment succeed or fail together
// - Ownership-first validation: Check WHO before WHAT
// - Executable Invariants: Helper functions for domain rules
//
// Flow:
// 1. Fetch Order
// 2. Validate ownership FIRST (Invariant 4)
// 3. Validate Order is payable (Invariant 2)
// 4. Check no active Payment exists (Invariant 1)
// 5. Execute atomic transaction:
//    - Create Payment record (PENDING)
//    - Transition Order to WAITING_PAYMENT
// 6. Return DTO (not raw entity)
//
// Future:
// - Publish PaymentIntentCreated domain event
// - Add to EventBus/Queue for Notification/Analytics
// ============================================================

import { prisma } from '../../infra/db/prisma.js';
import { PaymentRepository } from './payment.repository.js';
import { OrderLifecycleRules } from '../order/order-lifecycle.rules.js';
import { BusinessError } from '../../shared/errors/business.error.js';
import type { PaymentIntentResultDTO } from './payment-intent.types.js';
import type { CreatePaymentIntentInput } from './payment-intent.types.js';
import { PaymentIntentErrorCodes } from './payment-intent.types.js';
import type { OrderStatus } from '../order/order-lifecycle.types.js';

// ----- Executable Invariants (Helper Functions) -----
// These make invariants explicit and reusable

/**
 * Invariant 1: Exactly One ACTIVE Payment Per Order
 *
 * Ensures no duplicate PENDING payments exist for an order.
 */
async function ensureSinglePendingPayment(orderId: number): Promise<void> {
  const activePayment = await PaymentRepository.findActiveByOrderId(orderId);
  if (activePayment) {
    throw new BusinessError(
      `Order already has active payment (ID: ${activePayment.id})`,
      400,
      PaymentIntentErrorCodes.PAYMENT_EXISTS,
    );
  }
}

/**
 * Invariant 2: Order Can Accept Payment
 *
 * Ensures order is in DRAFT status (can transition to WAITING_PAYMENT).
 */
function ensurePayable(currentStatus: OrderStatus): void {
  if (!OrderLifecycleRules.isPayable(currentStatus)) {
    if (OrderLifecycleRules.isTerminal(currentStatus)) {
      throw new BusinessError(
        `Order cannot be paid — status is terminal: ${currentStatus}`,
        400,
        PaymentIntentErrorCodes.ORDER_TERMINAL,
      );
    }
    throw new BusinessError(
      `Order cannot initiate payment from status: ${currentStatus}. Expected: DRAFT`,
      400,
      PaymentIntentErrorCodes.ORDER_NOT_PAYABLE,
    );
  }
}

/**
 * Invariant 4: User Owns the Order
 *
 * Ensures requester has permission to pay for this order.
 * Security: Checked BEFORE revealing order status.
 */
function ensureOwnership(orderUserId: number, requestUserId: number): void {
  if (orderUserId !== requestUserId) {
    throw new BusinessError(
      'User does not own this order',
      403,
      PaymentIntentErrorCodes.ORDER_NOT_OWNED,
    );
  }
}

// ----- Domain Event Types -----
// Future: These will be published when Step 9 (Events) is implemented

export interface PaymentIntentCreatedEvent {
  readonly eventType: 'PAYMENT_INTENT_CREATED';
  readonly paymentId: number;
  readonly orderId: number;
  readonly userId: number;
  readonly amount: number;
  readonly timestamp: Date;
}

export const PaymentIntentService = {
  /**
   * Create Payment Intent
   *
   * The "Pay" button handler.
   * Creates the promise to pay, not the payment itself.
   *
   * Future:
   * - Publish PaymentIntentCreatedEvent to EventBus
   * - Trigger notification service
   * - Update analytics
   */
  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResultDTO> {
    // STEP 1: Fetch Order
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new BusinessError(
        `Order ${input.orderId} not found`,
        404,
        PaymentIntentErrorCodes.ORDER_NOT_FOUND,
      );
    }

    // STEP 2: Validate ownership FIRST (Invariant 4)
    // Security: Check WHO before revealing any information
    ensureOwnership(order.userId, input.userId);

    // STEP 3: Validate Order is payable (Invariant 2)
    ensurePayable(order.status as OrderStatus);

    // STEP 4: Check no active Payment exists (Invariant 1)
    await ensureSinglePendingPayment(input.orderId);

    // STEP 5: Execute atomic transaction (Invariant 2 + 3)
    // Atomic: Both Payment create AND Order update succeed or fail together
    const payment = await prisma.$transaction(async (tx) => {
      // 5a: Create Payment record
      const newPayment = await tx.payment.create({
        data: {
          orderId: input.orderId,
          userId: input.userId,
          amount: input.amount,
          currency: input.currency ?? 'IDR',
          provider: input.provider ?? 'STUB',
          status: 'PENDING',
        },
      });

      // 5b: Update Order status
      await tx.order.update({
        where: { id: input.orderId },
        data: { status: 'WAITING_PAYMENT' },
      });

      return newPayment;
    });

    // STEP 6: Return DTO (not raw entity)
    // Note: READY_FOR_GATEWAY is a Response Status, not Order/Payment status
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      status: 'READY_FOR_GATEWAY',
    };

    // Future: Publish domain event
    // const event: PaymentIntentCreatedEvent = {
    //   eventType: 'PAYMENT_INTENT_CREATED',
    //   paymentId: payment.id,
    //   orderId: payment.orderId,
    //   userId: payment.userId,
    //   amount: payment.amount,
    //   timestamp: new Date(),
    // };
    // await EventBus.publish(event);
  },
} as const;
