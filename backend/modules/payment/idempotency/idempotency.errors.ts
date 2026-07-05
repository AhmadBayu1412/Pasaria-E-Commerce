// ============================================================
// IDEMPOTENCY ERRORS
// Phase 5 Step 5: Idempotency Layer
//
// Philosophy:
// - ALL errors are BusinessError subclasses
// - NEVER throw plain Error in domain code
// - HTTP status codes match REST semantics
// ============================================================

import { BusinessError } from '../../../shared/errors/business.error.js';

export const IdempotencyErrorCodes = {
  KEY_NOT_FOUND: 'IDEMPOTENCY_KEY_NOT_FOUND',
  KEY_EXPIRED: 'IDEMPOTENCY_KEY_EXPIRED',
  KEY_IN_USE: 'IDEMPOTENCY_KEY_IN_USE',
  REQUEST_IN_PROGRESS: 'IDEMPOTENCY_REQUEST_IN_PROGRESS',
} as const;

export type IdempotencyErrorCode =
  (typeof IdempotencyErrorCodes)[keyof typeof IdempotencyErrorCodes];

/**
 * Thrown when idempotency key is expired
 * HTTP 410 Gone — resource no longer available
 *
 * NOTE: Not used in Step 5 (TTL not implemented)
 * Reserved for future when TTL is added
 */
export class IdempotencyKeyExpiredError extends BusinessError {
  constructor(key: string) {
    super(
      `Idempotency key has expired: ${key}`,
      410, // Gone
      IdempotencyErrorCodes.KEY_EXPIRED,
    );
    this.name = 'IdempotencyKeyExpiredError';
  }
}

/**
 * Thrown when another request is actively processing this key
 * HTTP 409 Conflict — request cannot be processed while another is in-flight
 *
 * This is the edge case where PENDING record exists but has no response yet.
 * In practice, client should replay with the same key to get cached response.
 */
export class IdempotencyRequestInProgressError extends BusinessError {
  constructor(key: string) {
    super(
      `Idempotency key "${key}" is currently being processed by another request`,
      409, // Conflict
      IdempotencyErrorCodes.REQUEST_IN_PROGRESS,
    );
    this.name = 'IdempotencyRequestInProgressError';
  }
}

/**
 * Thrown when idempotency check fails unexpectedly
 * HTTP 500 Internal Server Error
 */
export class IdempotencyCheckError extends BusinessError {
  constructor(message: string) {
    super(
      `Idempotency check failed: ${message}`,
      500,
      IdempotencyErrorCodes.KEY_NOT_FOUND,
    );
    this.name = 'IdempotencyCheckError';
  }
}
