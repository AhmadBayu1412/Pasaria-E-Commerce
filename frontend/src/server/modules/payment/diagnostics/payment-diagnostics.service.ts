// ============================================================
// PAYMENT DIAGNOSTICS SERVICE
// Phase 5 Step 9: Operational Readiness
//
// Philosophy:
// - Orchestration layer
// - Uses PaymentMetricsService for computation
// - Uses query modules for data retrieval
// - Read-only operations only
// ============================================================

import { prisma } from '../../../infra/db/prisma';
import { PaymentMetricsService } from '../metrics/payment-metrics.service';
import type {
  PaymentDiagnostics,
  PaymentDiagnosticsOptions,
  StuckPayment,
  RecentFailures,
  RecentFailure,
} from './payment-diagnostics.types';

// Default thresholds
const DEFAULT_STUCK_THRESHOLD_HOURS = 24;
const DEFAULT_STUCK_LIMIT = 50;
const DEFAULT_FAILURE_LIMIT = 20;

/**
 * Payment Diagnostics Service
 * 
 * Orchestrates diagnostics data from various sources:
 * - PaymentMetricsService for metrics computation
 * - Direct queries for stuck payments and failures
 * 
 * This is an orchestration layer - it does NOT compute metrics itself.
 */
export const PaymentDiagnosticsService = {
  /**
   * Get comprehensive payment diagnostics
   * 
   * @param options - Diagnostics options
   * @returns PaymentDiagnostics
   */
  async getDiagnostics(
    options: PaymentDiagnosticsOptions = {},
  ): Promise<PaymentDiagnostics> {
    const opts = {
      stuckThresholdHours: options.stuckThresholdHours ?? DEFAULT_STUCK_THRESHOLD_HOURS,
      stuckLimit: options.stuckLimit ?? DEFAULT_STUCK_LIMIT,
      failureLimit: options.failureLimit ?? DEFAULT_FAILURE_LIMIT,
    };
    
    // Run all queries in parallel
    const [stuckPayments, recentFailures, metrics] = await Promise.all([
      getStuckPayments(opts.stuckThresholdHours, opts.stuckLimit),
      getRecentFailures(opts.failureLimit),
      getMetricsSummary(),
    ]);
    
    return {
      stuckPayments,
      recentFailures,
      metrics,
      generatedAt: new Date(),
    };
  },
};

/**
 * Get stuck payments (pending > threshold)
 */
async function getStuckPayments(
  thresholdHours: number,
  limit: number,
): Promise<StuckPayment[]> {
  const thresholdTime = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
  
  const payments = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: thresholdTime },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true,
      orderId: true,
      amount: true,
      provider: true,
      createdAt: true,
      externalReference: true,
      snapToken: true,
    },
  });
  
  return payments.map(p => {
    const now = Date.now();
    const createdMs = p.createdAt.getTime();
    const ageHours = (now - createdMs) / (1000 * 60 * 60);
    
    return {
      paymentId: p.id,
      orderId: p.orderId,
      amount: Number(p.amount),
      provider: p.provider,
      createdAt: p.createdAt,
      ageHours: Math.round(ageHours * 10) / 10,
      hasExternalRef: !!p.externalReference,
      hasSnapToken: !!p.snapToken,
      recoveryCandidate: !!p.externalReference,
    };
  });
}

/**
 * Get recent failures from webhook events
 */
async function getRecentFailures(limit: number): Promise<RecentFailures> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const failedEvents = await prisma.webhookEvent.findMany({
    where: {
      status: 'FAILED',
      createdAt: { gte: twentyFourHoursAgo },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      gatewayTransactionId: true,
      createdAt: true,
      rawPayload: true,
    },
  });
  
  const failures: RecentFailure[] = failedEvents.map(e => ({
    transactionId: e.gatewayTransactionId,
    failedAt: e.createdAt,
    error: 'Webhook processing failed',
    type: 'WEBHOOK' as const,
  }));
  
  return {
    webhookErrors: failures.length,
    recoveryFailures: 0, // Would need recovery job tracking
    gatewayErrors: 0, // Would need gateway error tracking
    failures,
  };
}

/**
 * Get metrics summary from PaymentMetricsService
 */
async function getMetricsSummary() {
  const metrics = await PaymentMetricsService.getMetrics({ hours: 24 });
  
  return {
    successRate24h: metrics.successRate,
    avgConfirmationTimeMs: metrics.avgConfirmationTimeMs,
    pendingCount: metrics.pendingCount,
    todayPaymentCount: metrics.totalPayments,
  };
}
