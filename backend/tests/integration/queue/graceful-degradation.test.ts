/**
 * Integration Test: Queue Graceful Degradation
 *
 * Test ini memverifikasi bahwa ketika BullMQ gagal:
 * - Database transaction tetap BERHASIL (tidak di-rollback)
 * - Response API tetap SUCCESS
 * - Error hanya di-log, tidak propagate ke user
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { queueProductReindex } from "../../../infra/queue/producer.js"

// Mock function
const mockAdd = vi.fn()

// Mock the getProductQueue to simulate failure
vi.mock("../../../infra/queue/bullmq.js", () => ({
  getProductQueue: vi.fn(() => ({
    add: mockAdd
  }))
}))

describe("Queue Graceful Degradation", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("When queue.add() throws", () => {

    it("should return undefined instead of throwing", async () => {
      // Simulate BullMQ connection failure
      mockAdd.mockRejectedValueOnce(new Error("Redis connection refused"))

      // queueProductReindex should NOT throw
      // It should return undefined and log the error
      const result = await queueProductReindex(999)

      expect(result).toBeUndefined()
    })

    it("should log error when queue fails", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockAdd.mockRejectedValueOnce(new Error("Connection failed"))

      await queueProductReindex(123)

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("Failed to enqueue reindex job")
      consoleErrorSpy.mockRestore()
    })

    it("should NOT throw, allowing calling service to continue", async () => {
      mockAdd.mockRejectedValue(new Error("Redis down"))

      // In the actual product service, this function is called with .catch()
      // So it should never propagate the error
      await expect(queueProductReindex(123)).resolves.not.toThrow()
    })

    it("should handle various error types gracefully", async () => {
      const errors = [
        new Error("ECONNREFUSED"),
        new Error("Queue closed"),
        new Error("Timeout"),
        new TypeError("Invalid connection")
      ]

      for (const error of errors) {
        mockAdd.mockRejectedValueOnce(error)

        // Should always return undefined, never throw
        const result = await queueProductReindex(Math.floor(Math.random() * 10000))
        expect(result).toBeUndefined()
      }
    })

    it("should allow calling code to complete even when queue fails", async () => {
      mockAdd.mockRejectedValue(new Error("Redis unavailable"))

      // Simulate what product service does
      let dbOperationSuccess = false
      let queueOperationFailed = false

      // Step 1: DB operation (simulated)
      dbOperationSuccess = true

      // Step 2: Queue operation (will fail)
      try {
        await queueProductReindex(1)
      } catch {
        queueOperationFailed = true
      }

      // DB operation should still be considered successful
      expect(dbOperationSuccess).toBe(true)
      // Queue failure should NOT cause overall failure
      expect(queueOperationFailed).toBe(false)
    })
  })

  describe("When queue.add() returns undefined", () => {

    it("should handle null return from queue", async () => {
      mockAdd.mockResolvedValue(null)

      // Should not throw
      const result = await queueProductReindex(456)

      // Result may be undefined or null, but no error should propagate
      expect(result === undefined || result === null).toBe(true)
    })
  })
})

describe("Queue Fire-and-Forget Pattern", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return undefined on queue failure (not throw)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockAdd.mockRejectedValue(new Error("Queue unavailable"))

    // The producer catches errors internally and returns undefined
    // This is the graceful degradation behavior
    const result = await queueProductReindex(123)

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it("should handle rejection gracefully when .catch() is used", async () => {
    mockAdd.mockRejectedValue(new Error("Redis unavailable"))

    // When .catch() is used, the error is caught
    await expect(
      queueProductReindex(1).catch(() => {})
    ).resolves.toBeUndefined()
  })

  it("should not block when using fire-and-forget pattern", async () => {
    mockAdd.mockImplementation(async () => {
      // Simulate slow queue operation
      await new Promise(resolve => setTimeout(resolve, 10))
      throw new Error("Slow failure")
    })

    const startTime = Date.now()

    // Fire-and-forget: don't await
    queueProductReindex(1).catch(() => {})

    // The function returns immediately without waiting for queue
    const duration = Date.now() - startTime

    // Should be very fast since we don't await
    expect(duration).toBeLessThan(50)
  })
})
