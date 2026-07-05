-- AddWebhookEventAndTimeline
-- Phase 5 Step 6: Webhook Processing & Payment Confirmation

-- Create enum
CREATE TYPE "WebhookEventStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- Add gatewayTransactionId to Payment
ALTER TABLE "Payment" ADD COLUMN "gatewayTransactionId" TEXT;
CREATE INDEX "Payment_gatewayTransactionId_idx" ON "Payment" ("gatewayTransactionId");

-- Add relation to IdempotencyRecord (FK to Payment)
ALTER TABLE "IdempotencyRecord" ADD COLUMN "paymentId" INTEGER;
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL;

-- Create OrderTimeline table
CREATE TABLE "OrderTimeline" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderTimeline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "OrderTimeline_orderId_idx" ON "OrderTimeline" ("orderId");
CREATE INDEX "OrderTimeline_event_idx" ON "OrderTimeline" ("event");

-- Create WebhookEvent table
CREATE TABLE "WebhookEvent" (
    "id" SERIAL PRIMARY KEY,
    "gatewayTransactionId" VARCHAR(255) NOT NULL,
    "gatewayProvider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "paymentId" INTEGER,
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookEvent_gatewayTransactionId_unique" UNIQUE ("gatewayTransactionId"),
    CONSTRAINT "WebhookEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL
);
CREATE INDEX "WebhookEvent_status_createdAt_idx" ON "WebhookEvent" ("status", "createdAt");
CREATE INDEX "WebhookEvent_gatewayProvider_idx" ON "WebhookEvent" ("gatewayProvider");
