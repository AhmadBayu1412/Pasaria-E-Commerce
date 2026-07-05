// ============================================================
// IDEMPOTENCY REPOSITORY
// Phase 5 Step 5: Idempotency Layer
//
// Philosophy:
// - Pure data access, no business logic
// - Atomic operations where race conditions are possible
// - Uses Prisma's native handling for unique constraint violations
// ============================================================

import { prisma } from '../../../infra/db/prisma.js';
import type {
  IdempotencyRecord,
  IdempotencyRecordStatus,
  IdempotencyResourceType,
} from './idempotency.types.js';

interface PrismaIdempotencyRecord {
  id: number;
  idempotencyKey: string;
  resourceType: string;
  resourceId: number | null;
  requestHash: string | null;
  responseData: unknown;
  responseStatus: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

function toRecord(prismaRecord: PrismaIdempotencyRecord): IdempotencyRecord {
  return {
    id: prismaRecord.id,
    idempotencyKey: prismaRecord.idempotencyKey,
    resourceType: prismaRecord.resourceType as IdempotencyResourceType,
    resourceId: prismaRecord.resourceId,
    requestHash: prismaRecord.requestHash,
    responseData: prismaRecord.responseData,
    responseStatus: prismaRecord.responseStatus,
    status: prismaRecord.status as IdempotencyRecordStatus,
    createdAt: prismaRecord.createdAt,
    updatedAt: prismaRecord.updatedAt,
    expiresAt: prismaRecord.expiresAt,
  };
}

export const IdempotencyRepository = {
  /**
   * ATOMIC acquire: Try to create PENDING record
   *
   * Uses database UNIQUE constraint as atomic lock.
   * - If INSERT succeeds → caller owns this key, proceed
   * - If INSERT fails (conflict) → another request owns this key, fetch for replay
   *
   * @returns { record: IdempotencyRecord | null, acquired: boolean }
   */
  async acquire(
    key: string,
    resourceType: IdempotencyResourceType,
  ): Promise<{ record: IdempotencyRecord | null; acquired: boolean }> {
    try {
      const record = await prisma.idempotencyRecord.create({
        data: {
          idempotencyKey: key,
          resourceType,
          status: 'PENDING',
          responseData: {},
          responseStatus: 0,
        },
      });

      return { record: toRecord(record), acquired: true };
    } catch (error: unknown) {
      // P2002 = Unique constraint violation = key already exists
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        const existing = await prisma.idempotencyRecord.findUnique({
          where: { idempotencyKey: key },
        });
        return { record: existing ? toRecord(existing) : null, acquired: false };
      }
      throw error;
    }
  },

  /**
   * Find record by idempotency key
   * Used for replay logic after acquire fails
   */
  async findByKey(key: string): Promise<IdempotencyRecord | null> {
    const record = await prisma.idempotencyRecord.findUnique({
      where: { idempotencyKey: key },
    });

    return record ? toRecord(record) : null;
  },

  /**
   * Update record with completed response
   * Called after successful operation
   */
  async complete(
    key: string,
    resourceId: number | null,
    responseData: unknown,
    responseStatus: number,
  ): Promise<IdempotencyRecord> {
    const record = await prisma.idempotencyRecord.update({
      where: { idempotencyKey: key },
      data: {
        resourceId,
        responseData: responseData as object,
        responseStatus,
        status: 'COMPLETED',
      },
    });

    return toRecord(record);
  },

  /**
   * Mark record as failed
   * Allows retry for transient failures
   */
  async markFailed(key: string): Promise<IdempotencyRecord> {
    const record = await prisma.idempotencyRecord.update({
      where: { idempotencyKey: key },
      data: { status: 'FAILED' },
    });

    return toRecord(record);
  },

  /**
   * Delete expired records (for cleanup job)
   * Will be used in Phase Lanjutan when TTL is implemented
   */
  async deleteExpired(): Promise<number> {
    const result = await prisma.idempotencyRecord.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'COMPLETED',
      },
    });

    return result.count;
  },
} as const;
