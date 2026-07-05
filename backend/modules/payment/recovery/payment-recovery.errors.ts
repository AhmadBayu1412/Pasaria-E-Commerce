// ============================================================
// PAYMENT RECOVERY ERRORS
// Phase 5 Step 8: Recovery Engine Error Types
//
// Philosophy:
// - Domain-specific errors for the recovery engine
// - Clear error codes for programmatic handling
// - Payment context in error metadata for debugging
// ============================================================

/**
 * Base Payment Recovery Error
 */
export class PaymentRecoveryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly paymentId?: number,
    public readonly externalReference?: string,
  ) {
    super(message);
    this.name = 'PaymentRecoveryError';
  }
}

/**
 * Payment Not Found For Recovery Error
 * Thrown when a payment cannot be found by external reference during recovery.
 */
export class PaymentNotFoundForRecoveryError extends PaymentRecoveryError {
  constructor(externalReference: string) {
    super(
      `Payment not found for recovery: ${externalReference}`,
      'PAYMENT_NOT_FOUND_FOR_RECOVERY',
      undefined,
      externalReference,
    );
    this.name = 'PaymentNotFoundForRecoveryError';
  }
}

/**
 * Payment Not Recoverable Error
 * Thrown when a payment is not eligible for recovery.
 */
export class PaymentNotRecoverableError extends PaymentRecoveryError {
  constructor(paymentId: number, reason: string) {
    super(
      `Payment ${paymentId} is not recoverable: ${reason}`,
      'PAYMENT_NOT_RECOVERABLE',
      paymentId,
    );
    this.name = 'PaymentNotRecoverableError';
  }
}

/**
 * Recovery Gateway Error
 * Thrown when communication with payment gateway fails.
 */
export class RecoveryGatewayError extends PaymentRecoveryError {
  constructor(externalReference: string, providerError: string) {
    super(
      `Gateway error during recovery for ${externalReference}: ${providerError}`,
      'RECOVERY_GATEWAY_ERROR',
      undefined,
      externalReference,
    );
    this.name = 'RecoveryGatewayError';
  }
}

/**
 * Recovery Rate Limit Error
 * Thrown when provider rate limit is exceeded.
 */
export class RecoveryRateLimitError extends PaymentRecoveryError {
  constructor(waitMs: number) {
    super(
      `Rate limit exceeded. Wait ${waitMs}ms before retry.`,
      'RECOVERY_RATE_LIMIT',
    );
    this.name = 'RecoveryRateLimitError';
  }
}

/**
 * Recovery Batch Error
 * Thrown when batch processing fails.
 */
export class RecoveryBatchError extends PaymentRecoveryError {
  constructor(
    batchNumber: number,
    errorMessage: string,
    failedPayments: number[],
  ) {
    super(
      `Batch ${batchNumber} failed: ${errorMessage}. Failed payments: ${failedPayments.join(', ')}`,
      'RECOVERY_BATCH_ERROR',
    );
    this.name = 'RecoveryBatchError';
  }
}
