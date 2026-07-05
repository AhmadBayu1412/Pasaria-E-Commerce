/*
  Warnings:

  - You are about to drop the column `paymentId` on the `IdempotencyRecord` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalReference]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gatewayTransactionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalReference` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentProvider" ADD VALUE 'MIDTRANS';
ALTER TYPE "PaymentProvider" ADD VALUE 'XENDIT';

-- DropForeignKey
ALTER TABLE "IdempotencyRecord" DROP CONSTRAINT "IdempotencyRecord_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "WebhookEvent" DROP CONSTRAINT "WebhookEvent_paymentId_fkey";

-- DropIndex
DROP INDEX "Payment_gatewayTransactionId_idx";

-- AlterTable
ALTER TABLE "IdempotencyRecord" DROP COLUMN "paymentId";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "externalReference" TEXT NOT NULL,
ADD COLUMN     "snapToken" TEXT;

-- AlterTable
ALTER TABLE "WebhookEvent" ALTER COLUMN "gatewayTransactionId" SET DATA TYPE TEXT,
ALTER COLUMN "rawPayload" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalReference_key" ON "Payment"("externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayTransactionId_key" ON "Payment"("gatewayTransactionId");

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "WebhookEvent_gatewayTransactionId_unique" RENAME TO "WebhookEvent_gatewayTransactionId_key";
