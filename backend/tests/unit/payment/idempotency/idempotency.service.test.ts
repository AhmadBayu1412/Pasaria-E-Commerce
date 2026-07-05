// ============================================================
// IDEMPOTENCY SERVICE — UNIT TESTS
// Phase 5 Step 5: Idempotency Layer
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdempotencyService } from '../../../../modules/payment/idempotency/idempotency.service.js';
import { IdempotencyRepository } from '../../../../modules/payment/idempotency/idempotency.repository.js';
import { IdempotencyRequestInProgressError } from '../../../../modules/payment/idempotency/idempotency.errors.js';
import type { IdempotencyRecord } from '../../../../modules/payment/idempotency/idempotency.types.js';

// Mock the repository
vi.mock('../../../../modules/payment/idempotency/idempotency.repository.js');

describe('IdempotencyService', () => {
  let service: IdempotencyService;

  const mockAcquire = vi.mocked(IdempotencyRepository.acquire);
  const mockComplete = vi.mocked(IdempotencyRepository.complete);
  const mockMarkFailed = vi.mocked(IdempotencyRepository.markFailed);
  const mockFindByKey = vi.mocked(IdempotencyRepository.findByKey);

  beforeEach(() => {
    vi.clearAllMocks();
    service = new IdempotencyService();
  });

  describe('acquire()', () => {
    const baseInput = {
      idempotencyKey: 'test-key-123',
      resourceType: 'PAYMENT_INITIATE' as const,
    };

    it('should return acquired=true for new key (INSERT succeeds)', async () => {
      const mockRecord: IdempotencyRecord = {
        id: 1,
        idempotencyKey: 'test-key-123',
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

      mockAcquire.mockResolvedValue({
        record: mockRecord,
        acquired: true,
      });

      const result = await service.acquire<{ paymentId: number }>(baseInput);

      expect(result.acquired).toBe(true);
      expect(result.isReplay).toBe(false);
      expect(result.cachedResponse).toBeNull();
    });

    it('should return isReplay=true for COMPLETED key', async () => {
      const cachedResponse = { paymentId: 1, orderId: 100, redirectUrl: 'https://...' };
      const mockRecord: IdempotencyRecord = {
        id: 1,
        idempotencyKey: 'test-key-123',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: 1,
        requestHash: null,
        responseData: cachedResponse,
        responseStatus: 200,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      mockAcquire.mockResolvedValue({
        record: mockRecord,
        acquired: false,
      });

      const result = await service.acquire<typeof cachedResponse>(baseInput);

      expect(result.acquired).toBe(false);
      expect(result.isReplay).toBe(true);
      expect(result.cachedResponse).toEqual(cachedResponse);
    });

    it('should throw IdempotencyRequestInProgressError for PENDING key', async () => {
      const mockRecord: IdempotencyRecord = {
        id: 1,
        idempotencyKey: 'test-key-123',
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

      mockAcquire.mockResolvedValue({
        record: mockRecord,
        acquired: false,
      });

      // We do NOT replay partial responses from PENDING status
      // A partial response could be incomplete or inconsistent
      await expect(
        service.acquire(baseInput),
      ).rejects.toThrow('is currently being processed by another request');
    });

    it('should throw IdempotencyRequestInProgressError for PENDING key even with response', async () => {
      // Even if there's a partial response, we don't replay PENDING
      const partialResponse = { paymentId: 1, status: 'PENDING' };
      const mockRecord: IdempotencyRecord = {
        id: 1,
        idempotencyKey: 'test-key-123',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: 1,
        requestHash: null,
        responseData: partialResponse,
        responseStatus: 200,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      mockAcquire.mockResolvedValue({
        record: mockRecord,
        acquired: false,
      });

      await expect(
        service.acquire(baseInput),
      ).rejects.toThrow('is currently being processed by another request');
    });

    it('should allow retry for FAILED key', async () => {
      const mockRecord: IdempotencyRecord = {
        id: 1,
        idempotencyKey: 'test-key-123',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: null,
        requestHash: null,
        responseData: null,
        responseStatus: 0,
        status: 'FAILED',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      mockAcquire.mockResolvedValue({
        record: mockRecord,
        acquired: false,
      });

      const result = await service.acquire(baseInput);

      // FAILED should allow retry (acquired=true)
      expect(result.acquired).toBe(true);
      expect(result.isReplay).toBe(false);
    });

    it('should treat unknown status as acquired', async () => {
      const mockRecord: IdempotencyRecord = {
        id: 1,
        idempotencyKey: 'test-key-123',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: null,
        requestHash: null,
        responseData: null,
        responseStatus: 0,
        status: 'UNKNOWN' as IdempotencyRecord['status'],
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      mockAcquire.mockResolvedValue({
        record: mockRecord,
        acquired: false,
      });

      const result = await service.acquire(baseInput);

      // Unknown status treated as acquired for safety
      expect(result.acquired).toBe(true);
    });

    it('should treat null record as acquired (edge case)', async () => {
      mockAcquire.mockResolvedValue({
        record: null,
        acquired: false,
      });

      const result = await service.acquire(baseInput);

      // Edge case: record not found after conflict
      expect(result.acquired).toBe(true);
      expect(result.isReplay).toBe(false);
    });
  });

  describe('complete()', () => {
    it('should store response with COMPLETED status', async () => {
      mockComplete.mockResolvedValue({} as IdempotencyRecord);

      const response = { paymentId: 1, orderId: 100, redirectUrl: 'https://...' };
      await service.complete('key-123', 1, response, 200);

      expect(mockComplete).toHaveBeenCalledWith('key-123', 1, response, 200);
    });

    it('should accept null resourceId', async () => {
      mockComplete.mockResolvedValue({} as IdempotencyRecord);

      const response = { error: 'something went wrong' };
      await service.complete('key-123', null, response, 500);

      expect(mockComplete).toHaveBeenCalledWith('key-123', null, response, 500);
    });
  });

  describe('fail()', () => {
    it('should mark record as FAILED', async () => {
      mockMarkFailed.mockResolvedValue({} as IdempotencyRecord);

      await service.fail('key-123');

      expect(mockMarkFailed).toHaveBeenCalledWith('key-123');
    });
  });

  describe('replay()', () => {
    it('should return cached response for COMPLETED key', async () => {
      const cachedResponse = { paymentId: 1, orderId: 100 };
      const mockRecord: IdempotencyRecord = {
        id: 1,
        idempotencyKey: 'key-123',
        resourceType: 'PAYMENT_INITIATE',
        resourceId: 1,
        requestHash: null,
        responseData: cachedResponse,
        responseStatus: 200,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      };

      mockFindByKey.mockResolvedValue(mockRecord);

      const result = await service.replay<typeof cachedResponse>('key-123');

      expect(result).toEqual(cachedResponse);
    });

    it('should return null for non-existent key', async () => {
      mockFindByKey.mockResolvedValue(null);

      const result = await service.replay('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for PENDING key', async () => {
      const mockRecord: IdempotencyRecord = {
        id: 1,
        idempotencyKey: 'key-123',
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

      mockFindByKey.mockResolvedValue(mockRecord);

      const result = await service.replay('key-123');

      expect(result).toBeNull();
    });
  });
});

describe('IdempotencyErrorCodes', () => {
  it('should have all required error codes', async () => {
    const { IdempotencyErrorCodes } = await import(
      '../../../../modules/payment/idempotency/idempotency.errors.js'
    );

    expect(IdempotencyErrorCodes.KEY_NOT_FOUND).toBe('IDEMPOTENCY_KEY_NOT_FOUND');
    expect(IdempotencyErrorCodes.KEY_EXPIRED).toBe('IDEMPOTENCY_KEY_EXPIRED');
    expect(IdempotencyErrorCodes.KEY_IN_USE).toBe('IDEMPOTENCY_KEY_IN_USE');
    expect(IdempotencyErrorCodes.REQUEST_IN_PROGRESS).toBe('IDEMPOTENCY_REQUEST_IN_PROGRESS');
  });
});

describe('IdempotencyRecordStatus', () => {
  it('should have exactly 3 statuses', async () => {
    const { IDEMPOTENCY_STATUSES } = await import(
      '../../../../modules/payment/idempotency/idempotency.types.js'
    );

    expect(IDEMPOTENCY_STATUSES).toEqual(['PENDING', 'COMPLETED', 'FAILED']);
    expect(IDEMPOTENCY_STATUSES.length).toBe(3);
  });
});

describe('IdempotencyResourceType', () => {
  it('should support PAYMENT_INITIATE', async () => {
    const { IDEMPOTENCY_RESOURCE_TYPES } = await import(
      '../../../../modules/payment/idempotency/idempotency.types.js'
    );

    expect(IDEMPOTENCY_RESOURCE_TYPES).toContain('PAYMENT_INITIATE');
  });
});
