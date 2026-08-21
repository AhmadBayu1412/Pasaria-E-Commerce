// ============================================================
// PAYMENT HEALTH TYPES
// Phase 5 Step 9: Operational Readiness
//
// Philosophy:
// - Health contributor interface (not standalone endpoint)
// - Passive indicators instead of active probing
// - Aggregated by system health service
// ============================================================

/**
 * Health Status
 */
export enum HealthStatus {
  UP = 'UP',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Component Health Check Result
 */
export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
  lastChecked: Date;
}

/**
 * Gateway Health Indicator
 * 
 * Uses passive indicators (last successful communication)
 * instead of active probing to avoid rate limit issues.
 */
export interface GatewayHealthIndicator {
  lastWebhookReceived: Date | null;
  lastRecoverySuccess: Date | null;
  lastChargeSuccess: Date | null;
  /** Threshold in ms before considering gateway as DEGRADED */
  degradedThresholdMs: number;
  /** Threshold in ms before considering gateway as DOWN */
  downThresholdMs: number;
}

/**
 * Payment Health Contribution
 * 
 * What payment module contributes to system health.
 */
export interface PaymentHealthContribution {
  component: 'payment';
  status: HealthStatus;
  subComponents: {
    database: ComponentHealth;
    gateway: ComponentHealth;
    webhook: ComponentHealth;
    recovery: ComponentHealth;
  };
  lastChecked: Date;
}
