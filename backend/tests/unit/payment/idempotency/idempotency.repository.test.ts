// ============================================================
// IDEMPOTENCY REPOSITORY — UNIT TESTS
// Phase 5 Step 5: Idempotency Layer
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdempotencyRepository } from '../../../../modules/payment/idempotency/idempotency.repository.js';
import { prisma } from '../../../../infra/db/prisma.js';

// Mock Prisma
vi.mock('../../../../infra/db/prisma.js', () => ({
  prisma: {
    idempotencyRecord: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('IdempotencyRepository', () => {
  const mockPrisma = prisma as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('acquire()', () => {
    it('should return acquired=true when INSERT succeeds', async () => {
      const mockRecord = {
        id: 1,
        idempotencyKey: 'test-key',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: null,
        requestHash: null,
        responseData: {},
        responseStatus: 0,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      vi.mocked(mockPrisma.idempotencyRecord.create).mockResolvedValue(mockRecord);

      const result = await IdempotencyRepository.acquire('test-key', 'PAYMENT_INITIATE');

      expect(result.acquired).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record?.idempotencyKey).toBe('test-key');
    });

    it('should return acquired=false when UNIQUE constraint violated', async () => {
      const existingRecord = {
        id: 1,
        idempotencyKey: 'existing-key',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: 1,
        requestHash: null,
        responseData: { paymentId: 1 },
        responseStatus: 200,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      const uniqueError = new Error('Unique constraint');
      (uniqueError as unknown as { code: string }).code = 'P2002';
      vi.mocked(mockPrisma.idempotencyRecord.create).mockRejectedValue(uniqueError);
      vi.mocked(mockPrisma.idempotencyRecord.findUnique).mockResolvedValue(existingRecord);

      const result = await IdempotencyRepository.acquire('existing-key', 'PAYMENT_INITIATE');

      expect(result.acquired).toBe(false);
      expect(result.record?.idempotencyKey).toBe('existing-key');
      expect(result.record?.status).toBe('COMPLETED');
    });

    it('should rethrow non-unique errors', async () => {
      const otherError = new Error('Database error');
      (otherError as unknown as { code: string }).code = 'P3000';
      vi.mocked(mockPrisma.idempotencyRecord.create).mockRejectedValue(otherError);

      await expect(
        IdempotencyRepository.acquire('test-key', 'PAYMENT_INITIATE'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByKey()', () => {
    it('should return record when found', async () => {
      const mockRecord = {
        id: 1,
        idempotencyKey: 'test-key',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: 1,
        requestHash: null,
        responseData: { paymentId: 1 },
        responseStatus: 200,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      vi.mocked(mockPrisma.idempotencyRecord.findUnique).mockResolvedValue(mockRecord);

      const result = await IdempotencyRepository.findByKey('test-key');

      expect(result).toBeDefined();
      expect(result?.idempotencyKey).toBe('test-key');
    });

    it('should return null when not found', async () => {
      vi.mocked(mockPrisma.idempotencyRecord.findUnique).mockResolvedValue(null);

      const result = await IdempotencyRepository.findByKey('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('complete()', () => {
    it('should update record with COMPLETED status', async () => {
      const mockRecord = {
        id: 1,
        idempotencyKey: 'test-key',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: 1,
        requestHash: null,
        responseData: { paymentId: 1 },
        responseStatus: 200,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      vi.mocked(mockPrisma.idempotencyRecord.update).mockResolvedValue(mockRecord);

      const responseData = { paymentId: 1, orderId: 100 };
      const result = await IdempotencyRepository.complete('test-key', 1, responseData, 200);

      expect(mockPrisma.idempotencyRecord.update).toHaveBeenCalledWith({
        where: { idempotencyKey: 'test-key' },
        data: {
          resourceId: 1,
          responseData: responseData,
          responseStatus: 200,
          status: 'COMPLETED',
        },
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('should accept null resourceId', async () => {
      const mockRecord = {
        id: 1,
        idempotencyKey: 'test-key',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: null,
        requestHash: null,
        responseData: { error: 'failed' },
        responseStatus: 500,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      vi.mocked(mockPrisma.idempotencyRecord.update).mockResolvedValue(mockRecord);

      const responseData = { error: 'failed' };
      await IdempotencyRepository.complete('test-key', null, responseData, 500);

      expect(mockPrisma.idempotencyRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resourceId: null,
          }),
        }),
      );
    });
  });

  describe('markFailed()', () => {
    it('should update record with FAILED status', async () => {
      const mockRecord = {
        id: 1,
        idempotencyKey: 'test-key',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: null,
        requestHash: null,
        responseData: {},
        responseStatus: 0,
        status: 'FAILED',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      vi.mocked(mockPrisma.idempotencyRecord.update).mockResolvedValue(mockRecord);

      const result = await IdempotencyRepository.markFailed('test-key');

      expect(mockPrisma.idempotencyRecord.update).toHaveBeenCalledWith({
        where: { idempotencyKey: 'test-key' },
        data: { status: 'FAILED' },
      });
      expect(result.status).toBe('FAILED');
    });
  });

  describe('deleteExpired()', () => {
    it('should delete expired COMPLETED records', async () => {
      vi.mocked(mockPrisma.idempotencyRecord.deleteMany).mockResolvedValue({ count: 5 });

      const result = await IdempotencyRepository.deleteExpired();

      expect(mockPrisma.idempotencyRecord.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          status: 'COMPLETED',
        },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when no expired records', async () => {
      vi.mocked(mockPrisma.idempotencyRecord.deleteMany).mockResolvedValue({ count: 0 });

      const result = await IdempotencyRepository.deleteExpired();

      expect(result).toBe(0);
    });
  });
});
