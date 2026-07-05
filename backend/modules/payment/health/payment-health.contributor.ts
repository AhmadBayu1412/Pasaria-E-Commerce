// ============================================================
// PAYMENT HEALTH CONTRIBUTOR
// Phase 5 Step 9: Operational Readiness
//
// Philosophy:
// - Health contributor (not standalone endpoint)
// - Passive indicators for gateway health
// - Aggregated by system health service
// - Read-only operations only
// ============================================================

import { prisma } from '../../../infra/db/prisma.js';
import { checkDatabaseHealth } from '../../../infra/db/health.js';
import { PaymentRepository } from '../payment.repository.js';
import {
  HealthStatus,
  type ComponentHealth,
  type GatewayHealthIndicator,
  type PaymentHealthContribution,
} from './payment-health.types.js';

// Gateway health thresholds (in milliseconds)
const GATEWAY_DEGRADED_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const GATEWAY_DOWN_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Calculate gateway health from passive indicators
 * 
 * Instead of actively probing the gateway (which would hit rate limits),
 * we use the timestamp of the last successful communication.
 */
function calculateGatewayHealth(indicator: GatewayHealthIndicator): ComponentHealth {
  const now = Date.now();
  
  // Find the most recent successful communication
  const timestamps = [
    indicator.lastWebhookReceived?.getTime() ?? 0,
    indicator.lastRecoverySuccess?.getTime() ?? 0,
    indicator.lastChargeSuccess?.getTime() ?? 0,
  ];
  
  const mostRecent = Math.max(...timestamps);
  const elapsedMs = now - mostRecent;
  
  let status: HealthStatus;
  let message: string;
  
  if (elapsedMs > indicator.downThresholdMs) {
    status = HealthStatus.DOWN;
    message = 'No successful gateway communication in last 30 minutes';
  } else if (elapsedMs > indicator.degradedThresholdMs) {
    status = HealthStatus.DEGRADED;
    message = 'Gateway communication delayed (last success > 5 min ago)';
  } else {
    status = HealthStatus.UP;
    message = 'Gateway communication healthy';
  }
  
  return {
    name: 'gateway',
    status,
    message,
    details: {
      lastWebhookReceived: indicator.lastWebhookReceived,
      lastRecoverySuccess: indicator.lastRecoverySuccess,
      lastChargeSuccess: indicator.lastChargeSuccess,
      elapsedMs,
    },
    lastChecked: new Date(),
  };
}

/**
 * Check database health for payment module
 */
async function checkPaymentDatabaseHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    // Use existing database health check
    const dbHealth = await checkDatabaseHealth();
    
    // Also check payment-specific queries
    await prisma.payment.count({ take: 1 });
    
    return {
      name: 'database',
      status: dbHealth.database === 'UP' ? HealthStatus.UP : HealthStatus.DOWN,
      latencyMs: Date.now() - startTime,
      message: 'Payment database accessible',
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      name: 'database',
      status: HealthStatus.DOWN,
      latencyMs: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Database check failed',
      lastChecked: new Date(),
    };
  }
}

/**
 * Check webhook health by looking at recent webhook events
 */
async function checkWebhookHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    // Check recent webhook processing rate
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentEvents = await prisma.webhookEvent.count({
      where: {
        createdAt: { gte: fiveMinutesAgo },
      },
    });
    
    // If no events in 5 minutes, it's not necessarily bad
    // (could be low traffic period)
    // But if webhook table is accessible, that's good enough
    return {
      name: 'webhook',
      status: HealthStatus.UP,
      latencyMs: Date.now() - startTime,
      message: `Webhook service accessible (${recentEvents} events in last 5 min)`,
      details: { recentEventCount: recentEvents },
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      name: 'webhook',
      status: HealthStatus.DOWN,
      latencyMs: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Webhook check failed',
      lastChecked: new Date(),
    };
  }
}

/**
 * Check recovery health by looking at recovery job status
 */
async function checkRecoveryHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    // Check for stuck payments (pending > 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stuckCount = await prisma.payment.count({
      where: {
        status: 'PENDING',
        createdAt: { lt: oneDayAgo },
      },
    });
    
    // If > 10 stuck payments, recovery might need attention
    const status = stuckCount > 10 ? HealthStatus.DEGRADED : HealthStatus.UP;
    const message = stuckCount > 10
      ? `Recovery needed: ${stuckCount} stuck payments > 24h`
      : 'Recovery service healthy';
    
    return {
      name: 'recovery',
      status,
      latencyMs: Date.now() - startTime,
      message,
      details: { stuckPaymentCount: stuckCount },
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      name: 'recovery',
      status: HealthStatus.DOWN,
      latencyMs: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Recovery check failed',
      lastChecked: new Date(),
    };
  }
}

/**
 * Get gateway health indicator
 * 
 * This uses passive indicators - the last time we successfully
 * communicated with the gateway (via webhook, recovery, or charge).
 */
async function getGatewayHealthIndicator(): Promise<GatewayHealthIndicator> {
  // Get last webhook event
  const lastWebhook = await prisma.webhookEvent.findFirst({
    where: { status: 'PROCESSED' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  
  // For recovery, we can check payment records that were updated recently
  const lastRecovery = await prisma.payment.findFirst({
    where: {
      updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true },
  });
  
  return {
    lastWebhookReceived: lastWebhook?.createdAt ?? null,
    lastRecoverySuccess: lastRecovery?.updatedAt ?? null,
    lastChargeSuccess: null, // Would need charge history tracking
    degradedThresholdMs: GATEWAY_DEGRADED_THRESHOLD_MS,
    downThresholdMs: GATEWAY_DOWN_THRESHOLD_MS,
  };
}

/**
 * Payment Health Contributor
 * 
 * This is a contributor that can be aggregated by the system health service.
 * It does NOT create its own endpoint.
 */
export const PaymentHealthContributor = {
  name: 'payment' as const,
  
  /**
   * Get overall payment health contribution
   */
  async checkHealth(): Promise<PaymentHealthContribution> {
    const startTime = Date.now();
    
    // Run all health checks in parallel
    const [database, webhook, recovery, gatewayIndicator] = await Promise.all([
      checkPaymentDatabaseHealth(),
      checkWebhookHealth(),
      checkRecoveryHealth(),
      getGatewayHealthIndicator(),
    ]);
    
    const gateway = calculateGatewayHealth(gatewayIndicator);
    
    // Determine overall status (worst of all components)
    const statuses = [
      database.status,
      gateway.status,
      webhook.status,
      recovery.status,
    ];
    
    let overallStatus: HealthStatus;
    if (statuses.includes(HealthStatus.DOWN)) {
      overallStatus = HealthStatus.DOWN;
    } else if (statuses.includes(HealthStatus.DEGRADED)) {
      overallStatus = HealthStatus.DEGRADED;
    } else {
      overallStatus = HealthStatus.UP;
    }
    
    return {
      component: 'payment',
      status: overallStatus,
      subComponents: {
        database,
        gateway,
        webhook,
        recovery,
      },
      lastChecked: new Date(),
    };
  },
};

/**
 * Quick health check for payment-specific database operations
 */
export async function quickHealthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
  const startTime = Date.now();
  
  try {
    await prisma.payment.count({ take: 1 });
    return { healthy: true, latencyMs: Date.now() - startTime };
  } catch {
    return { healthy: false, latencyMs: Date.now() - startTime };
  }
}
