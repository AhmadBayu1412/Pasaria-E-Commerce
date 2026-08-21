// ============================================================
// IDEMPOTENCY TYPES
// Phase 5 Step 5: Idempotency Layer
//
// Philosophy:
// - IdempotencyRecord is a PERSISTENCE model, not Domain
// - Separated from Payment to support multi-resource idempotency
// - Step 5: NO TTL, NO request fingerprinting
// ============================================================

// ----- Record Status -----
// Note: These are runtime constants (not just types) for use in Prisma queries
export const IDEMPOTENCY_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;
export type IdempotencyRecordStatus = (typeof IDEMPOTENCY_STATUSES)[number];

// ----- Resource Types -----
export const IDEMPOTENCY_RESOURCE_TYPES = ['PAYMENT_INITIATE', 'REFUND', 'PAYOUT'] as const;
export type IdempotencyResourceType = (typeof IDEMPOTENCY_RESOURCE_TYPES)[number];

// ----- Record Entity -----
export interface IdempotencyRecord {
  readonly id: number;
  readonly idempotencyKey: string;
  readonly resourceType: IdempotencyResourceType;
  readonly resourceId: number | null;
  readonly responseData: unknown;
  readonly responseStatus: number;
  readonly status: IdempotencyRecordStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date | null; // Not used in Step 5
}

// ----- Acquire Input -----
export interface AcquireInput {
  readonly idempotencyKey: string;
  readonly resourceType: IdempotencyResourceType;
}

// ----- Acquire Result -----
export interface AcquireResult<T> {
  readonly acquired: boolean; // true = we own this key, proceed
  readonly isReplay: boolean; // true = return cached response
  readonly cachedResponse: T | null; // The cached response if isReplay=true
}
