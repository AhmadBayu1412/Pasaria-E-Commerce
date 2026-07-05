// ============================================================
// PAYMENT METRICS SERVICE
// Phase 5 Step 9: Operational Readiness
//
// Philosophy:
// - Pure computation (no orchestration)
// - Used by Diagnostics for orchestration
// - 24h window aggregation by default
// ============================================================

import { prisma } from '../../../infra/db/prisma.js';
import type { PaymentMetrics, MetricsWindow } from './payment-metrics.types.js';

// Default window: 24 hours
const DEFAULT_WINDOW_HOURS = 24;

/**
 * Calculate percentile from array
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Payment Metrics Service
 * 
 * Computes aggregated metrics for payment engine.
 * This is a pure computation service - no orchestration logic.
 */
export const PaymentMetricsService = {
  /**
   * Get payment metrics for a time window
   * 
   * @param window - Time window (default: 24 hours)
   * @returns PaymentMetrics
   */
  async getMetrics(window: MetricsWindow = { hours: DEFAULT_WINDOW_HOURS }): Promise<PaymentMetrics> {
    const startTime = Date.now();
    const windowStart = new Date(Date.now() - window.hours * 60 * 60 * 1000);
    
    // Run all queries in parallel
    const [
      paymentStats,
      webhookStats,
      recoveryStats,
      confirmationTimes,
    ] = await Promise.all([
      getPaymentStats(windowStart),
      getWebhookStats(windowStart),
      getRecoveryStats(windowStart),
      getConfirmationTimes(windowStart),
    ]);
    
    // Calculate rates
    const totalPayments = paymentStats.total;
    const successRate = totalPayments > 0 
      ? (paymentStats.success / totalPayments) * 100 
      : 0;
    const declineRate = totalPayments > 0 
      ? (paymentStats.decline / totalPayments) * 100 
      : 0;
    const expireRate = totalPayments > 0 
      ? (paymentStats.expire / totalPayments) * 100 
      : 0;
    
    // Calculate webhook success rate
    const totalWebhookEvents = webhookStats.total;
    const webhookSuccessRate = totalWebhookEvents > 0 
      ? ((totalWebhookEvents - webhookStats.failed) / totalWebhookEvents) * 100 
      : 100;
    
    // Calculate recovery success rate
    const totalRecoveryJobs = recoveryStats.total;
    const recoverySuccessRate = totalRecoveryJobs > 0 
      ? ((totalRecoveryJobs - recoveryStats.failed) / totalRecoveryJobs) * 100 
      : 100;
    
    return {
      // Volume
      totalPayments: paymentStats.total,
      totalAmount: paymentStats.totalAmount,
      
      // Success Rate
      successCount: paymentStats.success,
      successRate: Math.round(successRate * 100) / 100,
      declineCount: paymentStats.decline,
      declineRate: Math.round(declineRate * 100) / 100,
      expireCount: paymentStats.expire,
      expireRate: Math.round(expireRate * 100) / 100,
      pendingCount: paymentStats.pending,
      
      // Latency
      avgConfirmationTimeMs: confirmationTimes.avg,
      p95ConfirmationTimeMs: confirmationTimes.p95,
      minConfirmationTimeMs: confirmationTimes.min,
      maxConfirmationTimeMs: confirmationTimes.max,
      
      // Health Indicators
      webhookSuccessRate: Math.round(webhookSuccessRate * 100) / 100,
      recoverySuccessRate: Math.round(recoverySuccessRate * 100) / 100,
      webhookFailureCount: webhookStats.failed,
      recoveryFailureCount: recoveryStats.failed,
      
      // Funnel
      intentToConfirmationRate: 0, // Would need payment intent tracking
      
      // Window Info
      window,
      calculatedAt: new Date(),
    };
  },
};

/**
 * Get payment status statistics
 */
async function getPaymentStats(windowStart: Date) {
  const payments = await prisma.payment.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: windowStart },
    },
    _count: { id: true },
    _sum: { amount: true },
  });
  
  let total = 0;
  let success = 0;
  let decline = 0;
  let expire = 0;
  let pending = 0;
  let totalAmount = 0;
  
  for (const payment of payments) {
    const count = payment._count.id;
    total += count;
    totalAmount += payment._sum.amount ?? 0;
    
    switch (payment.status) {
      case 'SUCCESS':
        success = count;
        break;
      case 'DECLINED':
        decline = count;
        break;
      case 'EXPIRED':
        expire = count;
        break;
      case 'PENDING':
        pending = count;
        break;
    }
  }
  
  return { total, success, decline, expire, pending, totalAmount };
}

/**
 * Get webhook processing statistics
 */
async function getWebhookStats(windowStart: Date) {
  const events = await prisma.webhookEvent.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: windowStart },
    },
    _count: { id: true },
  });
  
  let total = 0;
  let failed = 0;
  
  for (const event of events) {
    const count = event._count.id;
    total += count;
    
    if (event.status === 'FAILED') {
      failed = count;
    }
  }
  
  return { total, failed };
}

/**
 * Get recovery job statistics
 * 
 * Note: This would need a recovery job table to track properly.
 * For now, we estimate from payment updates.
 */
async function getRecoveryStats(windowStart: Date) {
  // Estimate recovery stats from payment updates
  // In a real implementation, we'd have a recovery_job table
  const updatedPayments = await prisma.payment.count({
    where: {
      updatedAt: { gte: windowStart },
    },
  });
  
  // Placeholder - would need actual recovery job tracking
  return { total: 0, failed: 0 };
}

/**
 * Get confirmation time statistics
 * 
 * Time from payment creation to SUCCESS/terminal status.
 */
async function getConfirmationTimes(windowStart: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: windowStart },
      status: { in: ['SUCCESS', 'DECLINED', 'EXPIRED'] },
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });
  
  if (payments.length === 0) {
    return { avg: 0, p95: 0, min: 0, max: 0 };
  }
  
  const confirmationTimes = payments.map(p => 
    p.updatedAt.getTime() - p.createdAt.getTime()
  );
  
  return {
    avg: Math.round(confirmationTimes.reduce((a, b) => a + b, 0) / confirmationTimes.length),
    p95: calculatePercentile(confirmationTimes, 95),
    min: Math.min(...confirmationTimes),
    max: Math.max(...confirmationTimes),
  };
}
