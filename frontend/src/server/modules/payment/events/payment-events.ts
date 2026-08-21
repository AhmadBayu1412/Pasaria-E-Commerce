// ============================================================
// PAYMENT EVENTS
// Phase 5 Step 9: Operational Readiness
//
// Philosophy:
// - Event definitions only (no logging logic)
// - Used by PaymentLogger formatter
// - Structured events for observability
// ============================================================

/**
 * Payment Event Types
 * 
 * All payment-related events that can be logged.
 * Used by structured logging to ensure consistency.
 */
export enum PaymentEvent {
  // Intent Events
  PAYMENT_INTENT_CREATED = 'PAYMENT_INTENT_CREATED',
  PAYMENT_INTENT_FAILED = 'PAYMENT_INTENT_FAILED',

  // Gateway Events
  GATEWAY_CHARGE_INITIATED = 'GATEWAY_CHARGE_INITIATED',
  GATEWAY_CHARGE_SUCCESS = 'GATEWAY_CHARGE_SUCCESS',
  GATEWAY_CHARGE_FAILED = 'GATEWAY_CHARGE_FAILED',

  // Webhook Events
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  WEBHOOK_SIGNATURE_INVALID = 'WEBHOOK_SIGNATURE_INVALID',
  WEBHOOK_PROCESSED = 'WEBHOOK_PROCESSED',
  WEBHOOK_FAILED = 'WEBHOOK_FAILED',
  WEBHOOK_DUPLICATE = 'WEBHOOK_DUPLICATE',

  // Payment Status Events
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',

  // Recovery Events
  RECOVERY_STARTED = 'RECOVERY_STARTED',
  RECOVERY_BATCH_STARTED = 'RECOVERY_BATCH_STARTED',
  RECOVERY_BATCH_COMPLETED = 'RECOVERY_BATCH_COMPLETED',
  RECOVERY_COMPLETED = 'RECOVERY_COMPLETED',
  RECOVERY_FAILED = 'RECOVERY_FAILED',
  RECOVERY_MANUAL_TRIGGERED = 'RECOVERY_MANUAL_TRIGGERED',

  // Idempotency Events
  IDEMPOTENCY_ACQUIRED = 'IDEMPOTENCY_ACQUIRED',
  IDEMPOTENCY_REPLAY = 'IDEMPOTENCY_REPLAY',
  IDEMPOTENCY_COMPLETED = 'IDEMPOTENCY_COMPLETED',
  IDEMPOTENCY_FAILED = 'IDEMPOTENCY_FAILED',
}

/**
 * Payment Event Context
 * 
 * Common context fields for payment events.
 * Optional fields allow flexibility across different event types.
 */
export interface PaymentEventContext {
  paymentId?: number;
  orderId?: number;
  provider?: string;
  source?: 'WEBHOOK' | 'RECOVERY' | 'MANUAL';
  amount?: number;
  duration?: number;
  error?: string;
  correlationId?: string;
  externalReference?: string;
  gatewayTransactionId?: string;
}
