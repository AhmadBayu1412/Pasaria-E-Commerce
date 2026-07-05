// ============================================================
// WEBHOOK CONCURRENCY / INTEGRATION TEST
// Phase 5 Step 6: Duplicate Webhook Handling
//
// This test verifies the most critical invariant:
// "Concurrent duplicate webhooks MUST NOT cause race conditions"
//
// We test by sending multiple webhooks for the SAME transaction
// and verifying:
// 1. Only ONE Payment state transition occurs
// 2. Only ONE Timeline entry is created
// 3. All requests return 200 OK (idempotent)
//
// This is an INTEGRATION test because it tests:
// - Database constraints (UNIQUE)
// - Service transactions
// - Repository operations
// ============================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../../../infra/db/prisma.js';
import { WebhookService } from '../../../modules/payment/webhook/webhook.service.js';
import { WebhookValidator } from '../../../modules/payment/webhook/webhook.validator.js';
import { PaymentConfirmationService } from '../../../modules/payment/payment-confirmation.service.js';
import type { WebhookPayload } from '../../../modules/payment/webhook/webhook.types.js';

describe('Webhook Concurrency: Duplicate Handling', () => {
  let webhookService: WebhookService;
  let testOrderId: number;
  let testPaymentId: number;
  const TEST_TRANSACTION_ID = `test_concurrent_${Date.now()}`;

  const createPayload = (overrides: Partial<WebhookPayload> = {}): WebhookPayload => ({
    transactionId: TEST_TRANSACTION_ID,
    orderId: String(testOrderId),
    status: 'success',
    amount: 100000,
    currency: 'IDR',
    timestamp: new Date().toISOString(),
    signature: 'valid-signature',
    ...overrides,
  });

  beforeAll(async () => {
    // Setup: Create test order and payment
    webhookService = new WebhookService(
      new WebhookValidator({ stubEnabled: true }),
      new PaymentConfirmationService(),
    );

    // Create test user first
    const user = await prisma.user.create({
      data: {
        email: `test_concurrent_${Date.now()}@test.com`,
        name: 'Test User',
        password: 'hashed_password',
      },
    });

    // Create test order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: 'WAITING_PAYMENT',
        totalAmount: 100000,
        items: {
          create: {
            productId: 1, // Assuming product exists
            quantity: 1,
            unitPrice: 100000,
          },
        },
      },
      include: { items: true },
    });

    testOrderId = order.id;

    // Create test payment
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: user.id,
        amount: 100000,
        currency: 'IDR',
        provider: 'STUB',
        status: 'PENDING',
      },
    });

    testPaymentId = payment.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    try {
      await prisma.orderTimeline.deleteMany({
        where: { orderId: testOrderId },
      });
      await prisma.webhookEvent.deleteMany({
        where: { gatewayTransactionId: TEST_TRANSACTION_ID },
      });
      await prisma.payment.deleteMany({
        where: { orderId: testOrderId },
      });
      await prisma.order.delete({
        where: { id: testOrderId },
      });
      await prisma.user.delete({
        where: { id: (await prisma.order.findUnique({ where: { id: testOrderId } }))?.userId ?? 0 },
      }).catch(() => {});
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Reset payment status before each test
    await prisma.payment.update({
      where: { id: testPaymentId },
      data: {
        status: 'PENDING',
        gatewayTransactionId: null,
      },
    });

    // Clear webhook events
    await prisma.webhookEvent.deleteMany({
      where: { gatewayTransactionId: TEST_TRANSACTION_ID },
    });

    // Clear timeline
    await prisma.orderTimeline.deleteMany({
      where: { orderId: testOrderId },
    });
  });

  describe('INVARIANT: One Transaction → One Confirmation', () => {
    it('should only confirm payment ONCE even with 5 concurrent requests', async () => {
      // Arrange: Send 5 concurrent webhooks
      const concurrentRequests = 5;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          webhookService.processWebhook(createPayload(), 'STUB'),
        );
      }

      // Act: Execute all requests concurrently
      const results = await Promise.all(promises);

      // Assert 1: All requests return 200 (idempotent)
      results.forEach((result) => {
        expect(result.statusCode).toBe(200);
      });

      // Assert 2: Payment is CONFIRMED exactly once
      const payment = await prisma.payment.findUnique({
        where: { id: testPaymentId },
      });
      expect(payment?.status).toBe('SUCCESS');
      expect(payment?.gatewayTransactionId).toBe(TEST_TRANSACTION_ID);

      // Assert 3: Order is PAID
      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
      });
      expect(order?.status).toBe('PAID');

      // Assert 4: Only ONE timeline entry for PAYMENT_CONFIRMED
      const timelineEntries = await prisma.orderTimeline.findMany({
        where: {
          orderId: testOrderId,
          event: 'PAYMENT_CONFIRMED',
        },
      });
      expect(timelineEntries.length).toBe(1);

      // Assert 5: Only ONE webhook event record exists
      const webhookEvents = await prisma.webhookEvent.findMany({
        where: { gatewayTransactionId: TEST_TRANSACTION_ID },
      });
      expect(webhookEvents.length).toBe(1);
      expect(webhookEvents[0]?.status).toBe('PROCESSED');
    });

    it('should handle sequential duplicate requests idempotently', async () => {
      // Arrange: Send 3 requests sequentially
      const payload = createPayload();

      // Act: First request
      const result1 = await webhookService.processWebhook(payload, 'STUB');
      expect(result1.statusCode).toBe(200);

      // Second request (duplicate)
      const result2 = await webhookService.processWebhook(payload, 'STUB');
      expect(result2.statusCode).toBe(200);

      // Third request (duplicate)
      const result3 = await webhookService.processWebhook(payload, 'STUB');
      expect(result3.statusCode).toBe(200);

      // Assert: Only ONE timeline entry exists
      const timelineEntries = await prisma.orderTimeline.findMany({
        where: {
          orderId: testOrderId,
          event: 'PAYMENT_CONFIRMED',
        },
      });
      expect(timelineEntries.length).toBe(1);
    });

    it('should mark first acquired event as PROCESSED, others skipped', async () => {
      // Act: Send 3 concurrent requests
      await Promise.all([
        webhookService.processWebhook(createPayload(), 'STUB'),
        webhookService.processWebhook(createPayload(), 'STUB'),
        webhookService.processWebhook(createPayload(), 'STUB'),
      ]);

      // Assert: All webhook events exist, one is PROCESSED
      const events = await prisma.webhookEvent.findMany({
        where: { gatewayTransactionId: TEST_TRANSACTION_ID },
        orderBy: { createdAt: 'asc' },
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.length).toBeLessThanOrEqual(3); // Depends on race

      // At least one should be PROCESSED
      const processedCount = events.filter((e) => e.status === 'PROCESSED').length;
      expect(processedCount).toBe(1);
    });
  });

  describe('Error Handling: Silent Failures', () => {
    it('should return 200 even when payment not found (silent failure)', async () => {
      // This tests the "return 200 on error" behavior
      const payload: WebhookPayload = {
        transactionId: `nonexistent_${Date.now()}`,
        orderId: '999999', // Non-existent order
        status: 'success',
        amount: 100000,
        currency: 'IDR',
        timestamp: new Date().toISOString(),
        signature: 'valid-signature',
      };

      const result = await webhookService.processWebhook(payload, 'STUB');

      // Should return 200 to stop gateway retry
      expect(result.statusCode).toBe(200);

      // But should log the error
      expect(result.shouldLog).toBe(true);
    });

    it('should mark event as FAILED when processing error occurs', async () => {
      // This verifies audit trail even for failed processing
      const payload: WebhookPayload = {
        transactionId: `fail_${Date.now()}`,
        orderId: '999999', // Non-existent
        status: 'success',
        amount: 100000,
        currency: 'IDR',
        timestamp: new Date().toISOString(),
        signature: 'valid-signature',
      };

      await webhookService.processWebhook(payload, 'STUB');

      // Verify webhook event is marked as FAILED
      const event = await prisma.webhookEvent.findFirst({
        where: { gatewayTransactionId: payload.transactionId },
      });

      expect(event?.status).toBe('FAILED');
      expect(event?.errorMessage).toBeTruthy();
    });
  });

  describe('Amount Validation', () => {
    it('should reject webhook with wrong amount', async () => {
      const payload = createPayload({ amount: 50000 }); // Wrong amount

      const result = await webhookService.processWebhook(payload, 'STUB');

      // Returns 200 (stop retry) but with error logged
      expect(result.statusCode).toBe(200);
      expect(result.shouldLog).toBe(true);
    });
  });
});
