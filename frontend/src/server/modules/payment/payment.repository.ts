// ============================================================
// PAYMENT REPOSITORY
// Phase 5 Step 2: Data Access Layer
//
// Philosophy:
// - Repository pattern for data access
// - All queries go through repository
// - MINIMAL methods for Step 2
// ============================================================

import { prisma } from '../../infra/db/prisma';
import { PaymentMapper } from './payment.mapper';
import type {
  Payment,
  PaymentStatus,
  CreatePaymentInput,
} from './payment.types';

export const PaymentRepository = {
  // ----- Create -----

  /**
   * Create a new Payment record
   * 
   * NOTE: Status should be passed from caller (Service layer)
   * to keep Repository as pure persistence layer.
   * 
   * @param input - CreatePaymentInput with explicit status
   */
  async create(input: CreatePaymentInput & { status: PaymentStatus; externalReference: string }): Promise<Payment> {
    const payment = await prisma.payment.create({
      data: {
        orderId: input.orderId,
        userId: input.userId,
        amount: input.amount,
        currency: input.currency,
        provider: input.provider,
        status: input.status as any,
        externalReference: input.externalReference,
      },
    });

    return PaymentMapper.toDomain(payment);
  },

  // ----- Read -----

  /**
   * Find Payment by ID
   */
  async findById(id: number): Promise<Payment | null> {
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  },

  /**
   * Find Payment by Order ID
   * Returns the LATEST payment for an order
   */
  async findByOrderId(orderId: number): Promise<Payment | null> {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  },

  /**
   * Find ACTIVE (PENDING) Payment by Order ID
   * Used for: "Does this order have an active payment?"
   */
  async findActiveByOrderId(orderId: number): Promise<Payment | null> {
    const payment = await prisma.payment.findFirst({
      where: {
        orderId,
        status: 'PENDING',
      },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  },

  // ----- Update -----

  /**
   * Update Payment status
   * Used by: Webhook handler (Step 6)
   */
  async updateStatus(id: number, status: PaymentStatus): Promise<Payment> {
    const payment = await prisma.payment.update({
      where: { id },
      data: { status: status as any },
    });

    return PaymentMapper.toDomain(payment);
  },

  /**
   * Find Payment by gatewayTransactionId
   * Used by: Webhook handler (Step 6) for exact match
   */
  async findByTransactionId(gatewayTransactionId: string): Promise<Payment | null> {
    const payment = await prisma.payment.findFirst({
      where: { gatewayTransactionId },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  },

  /**
   * Find PENDING Payment by Order ID
   * Used by: Webhook handler for fallback lookup
   */
  async findPendingByOrderId(orderId: number): Promise<Payment | null> {
    const payment = await prisma.payment.findFirst({
      where: {
        orderId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  },

  /**
   * Update Payment with transaction ID and status
   * Used by: Webhook handler (Step 6)
   */
  async updateTransactionAndStatus(
    id: number,
    gatewayTransactionId: string,
    status: PaymentStatus,
  ): Promise<Payment> {
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        gatewayTransactionId,
        status: status as any,
      },
    });

    return PaymentMapper.toDomain(payment);
  },
} as const;
