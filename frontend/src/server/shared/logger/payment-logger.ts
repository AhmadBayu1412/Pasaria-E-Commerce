// ============================================================
// PAYMENT LOGGER FORMATTER
// Phase 5 Step 9: Operational Readiness
//
// Philosophy:
// - Shared logger infrastructure
// - Payment-specific formatter for structured logging
// - Integrates with shared/logger base
// ============================================================

import { PaymentEvent, type PaymentEventContext } from '../../modules/payment/events/payment-events';

/**
 * Payment Log Entry
 * 
 * Structured format for payment events.
 */
export interface PaymentLogEntry {
  event: PaymentEvent;
  paymentId?: number;
  orderId?: number;
  provider?: string;
  source?: string;
  amount?: number;
  duration?: number;
  error?: string;
  correlationId?: string;
  externalReference?: string;
  gatewayTransactionId?: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
}

/**
 * Format a payment event to structured log entry
 * 
 * @param event - Payment event type
 * @param context - Event context
 * @param level - Log level
 * @returns Structured log entry
 */
export function formatPaymentLog(
  event: PaymentEvent,
  context: PaymentEventContext = {},
  level: 'INFO' | 'WARN' | 'ERROR' = 'INFO',
): PaymentLogEntry {
  return {
    event,
    timestamp: new Date().toISOString(),
    level,
    ...context,
  };
}

/**
 * Log a payment event
 * 
 * @param event - Payment event type
 * @param context - Event context
 * @param level - Log level
 */
export function logPaymentEvent(
  event: PaymentEvent,
  context: PaymentEventContext = {},
  level: 'INFO' | 'WARN' | 'ERROR' = 'INFO',
): void {
  const entry = formatPaymentLog(event, context, level);
  
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

/**
 * Log payment success event
 * 
 * @param event - Payment event
 * @param context - Event context
 */
export function logPaymentSuccess(
  event: PaymentEvent,
  context: PaymentEventContext = {},
): void {
  logPaymentEvent(event, context, 'INFO');
}

/**
 * Log payment warning event
 * 
 * @param event - Payment event
 * @param context - Event context
 */
export function logPaymentWarning(
  event: PaymentEvent,
  context: PaymentEventContext = {},
): void {
  logPaymentEvent(event, context, 'WARN');
}

/**
 * Log payment error event
 * 
 * @param event - Payment event
 * @param context - Event context
 */
export function logPaymentError(
  event: PaymentEvent,
  context: PaymentEventContext = {},
): void {
  logPaymentEvent(event, context, 'ERROR');
}
