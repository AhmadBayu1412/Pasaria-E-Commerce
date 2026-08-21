// ============================================================
// PAYMENT METRICS TYPES
// Phase 5 Step 9: Operational Readiness
//
// Philosophy:
// - Pure computation (no orchestration)
// - Used by Diagnostics for orchestration
// - 24h window aggregation by default
// ============================================================

/**
 * Payment Metrics Time Window
 */
export interface MetricsWindow {
  hours: number;
}

/**
 * Payment Metrics
 * 
 * Aggregated payment metrics for dashboards and alerting.
 */
export interface PaymentMetrics {
  // Volume
  totalPayments: number;
  totalAmount: number;
  
  // Success Rate
  successCount: number;
  successRate: number;
  declineCount: number;
  declineRate: number;
  expireCount: number;
  expireRate: number;
  pendingCount: number;
  
  // Latency (in milliseconds)
  avgConfirmationTimeMs: number;
  p95ConfirmationTimeMs: number;
  minConfirmationTimeMs: number;
  maxConfirmationTimeMs: number;
  
  // Health Indicators
  webhookSuccessRate: number;
  recoverySuccessRate: number;
  webhookFailureCount: number;
  recoveryFailureCount: number;
  
  // Funnel
  intentToConfirmationRate: number;
  
  // Window Info
  window: MetricsWindow;
  calculatedAt: Date;
}
