// ============================================================
// WEBHOOK ERRORS
// Phase 5 Step 6: Webhook Processing & Payment Confirmation
//
// Philosophy:
// - Errors are categorized by HTTP response strategy
// - Security errors (invalid signature) → 403
// - Client errors (invalid payload) → 400
// - Internal errors → logged, but return 200 to stop retry
// ============================================================

import { BusinessError } from '../../../shared/errors/business.error';

export const WebhookErrorCodes = {
  // Security (403 Forbidden)
  INVALID_SIGNATURE: 'WEBHOOK_INVALID_SIGNATURE',
  MISSING_SIGNATURE: 'WEBHOOK_MISSING_SIGNATURE',

  // Client Error (400 Bad Request)
  INVALID_PAYLOAD: 'WEBHOOK_INVALID_PAYLOAD',
  MISSING_REQUIRED_FIELD: 'WEBHOOK_MISSING_REQUIRED_FIELD',
  UNSUPPORTED_PROVIDER: 'WEBHOOK_UNSUPPORTED_PROVIDER',

  // Business (logged, but return 200)
  ORDER_NOT_FOUND: 'WEBHOOK_ORDER_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'WEBHOOK_PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_CONFIRMED: 'WEBHOOK_PAYMENT_ALREADY_CONFIRMED',
  AMOUNT_MISMATCH: 'WEBHOOK_AMOUNT_MISMATCH',
} as const;

export type WebhookErrorCode =
  (typeof WebhookErrorCodes)[keyof typeof WebhookErrorCodes];

/**
 * Security errors — Return 403 to gateway
 * Gateway should NOT retry these
 */
export class WebhookSignatureError extends BusinessError {
  constructor(message = 'Invalid webhook signature') {
    super(message, 403, WebhookErrorCodes.INVALID_SIGNATURE);
    this.name = 'WebhookSignatureError';
  }
}

export class WebhookMissingSignatureError extends BusinessError {
  constructor(provider: string) {
    super(
      `Missing required signature for ${provider} webhook`,
      403,
      WebhookErrorCodes.MISSING_SIGNATURE,
    );
    this.name = 'WebhookMissingSignatureError';
  }
}

/**
 * Payload errors — Return 400 to gateway
 * Gateway may retry but with corrected payload
 */
export class WebhookPayloadError extends BusinessError {
  constructor(message: string) {
    super(message, 400, WebhookErrorCodes.INVALID_PAYLOAD);
    this.name = 'WebhookPayloadError';
  }
}

export class WebhookMissingFieldError extends BusinessError {
  constructor(field: string) {
    super(
      `Missing required field: ${field}`,
      400,
      WebhookErrorCodes.MISSING_REQUIRED_FIELD,
    );
    this.name = 'WebhookMissingFieldError';
  }
}

/**
 * Unsupported provider — Return 400 to gateway
 * Provider not recognized, not a server error
 */
export class WebhookUnsupportedProviderError extends BusinessError {
  constructor(provider: string) {
    super(
      `Unsupported webhook provider: ${provider}`,
      400,
      WebhookErrorCodes.UNSUPPORTED_PROVIDER,
    );
    this.name = 'WebhookUnsupportedProviderError';
  }
}
