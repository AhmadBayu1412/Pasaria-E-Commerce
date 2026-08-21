// ============================================================
// IDEMPOTENCY SERVICE
// Phase 5 Step 5: Idempotency Layer
//
// Philosophy:
// - Atomic operations: acquire() is the single entry point
// - Each method has ONE responsibility
// - No business logic, only orchestration
//
// TODO Phase 6:
// - Add structured logging (acquire success, replay, conflict, failure)
// - Add metrics hooks (idempotency_replay_total, duplicate_request_total)
// - Add TTL/Expiry management with cleanup job
//
// NOTE on FAILED status:
// - Transient failures (network timeout, DB connection) → FAILED → retry allowed
// - Business failures (credit card declined) → should NOT be marked FAILED
//   because client should NOT retry with same payment method
// - Currently FAILED marks any failure; refinement is future work
// ============================================================

import { IdempotencyRepository } from './idempotency.repository';
import type {
  AcquireInput,
  AcquireResult,
  IdempotencyRecord,
} from './idempotency.types';
import { IdempotencyRequestInProgressError } from './idempotency.errors';

/**
 * Step 5 Scope:
 * - NO TTL/Expiry (Phase Lanjutan)
 * - NO request fingerprinting (Phase Lanjutan)
 * - NO structured logging (Phase Lanjutan)
 * - NO metrics (Phase Lanjutan)
 */
export class IdempotencyService {
  /**
   * ACQUIRE — Atomic idempotency key acquisition
   *
   * This is the CORE method. Uses database UNIQUE constraint as lock.
   *
   * @param input - Idempotency key and resource type
   * @returns AcquireResult with immediate ownership decision
   *
   * Flow:
   * - INSERT succeeds → we own it → acquired=true, proceed with processing
   * - INSERT fails (conflict) → someone else owns it → acquired=false, check status
   *   - COMPLETED → isReplay=true, return cached response
   *   - PENDING → throw IdempotencyRequestInProgressError (409 Conflict)
   *   - FAILED → allow retry (treat as new request)
   */
  async acquire<T>(input: AcquireInput): Promise<AcquireResult<T>> {
    const result = await IdempotencyRepository.acquire(
      input.idempotencyKey,
      input.resourceType,
    );

    // Case 1: We acquired the key → proceed with processing
    if (result.acquired && result.record) {
      return {
        acquired: true,
        isReplay: false,
        cachedResponse: null,
      };
    }

    // Case 2: Key exists, we didn't acquire → check status for replay
    if (result.record) {
      return this.determineReplayBehavior<T>(result.record);
    }

    // Case 3: Key exists but record not found (edge case)
    // Treat as acquired to prevent infinite loops
    return {
      acquired: true,
      isReplay: false,
      cachedResponse: null,
    };
  }

  /**
   * Determine if we should replay or retry based on record status
   *
   * COMPLETED → replay cached response (safe, response is complete)
   * PENDING → conflict (another request in-flight, return 409)
   * FAILED → allow retry (transient failure, safe to retry)
   *
   * NOTE: We do NOT replay partial responses from PENDING status.
   * A partial response could be incomplete or inconsistent.
   * Client should wait for original request or retry with 409 handling.
   */
  private determineReplayBehavior<T>(
    record: IdempotencyRecord,
  ): AcquireResult<T> {
    switch (record.status) {
      case 'COMPLETED':
        // Safe to replay: response is complete and verified
        return {
          acquired: false,
          isReplay: true,
          cachedResponse: record.responseData as T,
        };

      case 'PENDING':
        // Another request is actively processing this key
        // Do NOT replay partial responses - could be incomplete
        throw new IdempotencyRequestInProgressError(record.idempotencyKey);

      case 'FAILED':
        // Transient failure — allow retry
        // TODO: Consider checking failure type before allowing retry
        return {
          acquired: true,
          isReplay: false,
          cachedResponse: null,
        };

      default:
        // Unknown status — treat as acquired for safety
        return {
          acquired: true,
          isReplay: false,
          cachedResponse: null,
        };
    }
  }

  /**
   * COMPLETE — Store successful response
   *
   * @param key - Idempotency key
   * @param resourceId - Related resource ID (e.g., Payment ID)
   * @param responseData - The response to cache
   * @param responseStatus - HTTP status code
   */
  async complete(
    key: string,
    resourceId: number | null,
    responseData: unknown,
    responseStatus: number,
  ): Promise<void> {
    await IdempotencyRepository.complete(
      key,
      resourceId,
      responseData,
      responseStatus,
    );
  }

  /**
   * FAIL — Mark request as failed, allows retry
   *
   * @param key - Idempotency key
   */
  async fail(key: string): Promise<void> {
    await IdempotencyRepository.markFailed(key);
  }

  /**
   * REPLAY — Get cached response for replay (utility method)
   *
   * @param key - Idempotency key
   * @returns Cached response or null
   */
  async replay<T>(key: string): Promise<T | null> {
    const record = await IdempotencyRepository.findByKey(key);
    if (record && record.status === 'COMPLETED') {
      return record.responseData as T;
    }
    return null;
  }
}
