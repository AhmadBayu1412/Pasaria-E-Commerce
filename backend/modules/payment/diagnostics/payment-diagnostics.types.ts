// ============================================================
// PAYMENT DIAGNOSTICS TYPES
// Phase 5 Step 9: Operational Readiness
//
// Philosophy:
// - Orchestration layer (uses MetricsService)
// - Query definitions for diagnostics
// ============================================================

/**
 * Stuck Payment
 */
export interface StuckPayment {
  paymentId: number;
  orderId: number;
  amount: number;
  provider: string;
  createdAt: Date;
  ageHours: number;
  hasExternalRef: boolean;
  hasSnapToken: boolean;
  recoveryCandidate: boolean;
}

/**
 * Recent Failure
 */
export interface RecentFailure {
  transactionId: string;
  failedAt: Date;
  error: string;
  type: 'WEBHOOK' | 'RECOVERY' | 'GATEWAY';
}

/**
 * Recent Failures Summary
 */
export interface RecentFailures {
  webhookErrors: number;
  recoveryFailures: number;
  gatewayErrors: number;
  failures: RecentFailure[];
}

/**
 * Payment Diagnostics Options
 */
export interface PaymentDiagnosticsOptions {
  /** Threshold in hours for considering a payment as "stuck" */
  stuckThresholdHours?: number;
  /** Maximum number of stuck payments to return */
  stuckLimit?: number;
  /** Maximum number of recent failures to return */
  failureLimit?: number;
}

/**
 * Payment Diagnostics
 * 
 * Aggregated diagnostics for operations team.
 * This is an orchestration layer that uses MetricsService and query modules.
 */
export interface PaymentDiagnostics {
  stuckPayments: StuckPayment[];
  recentFailures: RecentFailures;
  /** Metrics from PaymentMetricsService */
  metrics: {
    successRate24h: number;
    avgConfirmationTimeMs: number;
    pendingCount: number;
    todayPaymentCount: number;
  };
  generatedAt: Date;
}
