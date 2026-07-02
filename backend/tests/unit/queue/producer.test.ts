import { describe, it, expect, vi, beforeEach } from "vitest"
import { queueProductReindex, getPendingJobCount, hasJob } from "../../../infra/queue/producer.js"

// Mock the getProductQueue function instead of BullMQ constructor
vi.mock("../../../infra/queue/bullmq.js", () => ({
  getProductQueue: vi.fn(() => ({
    add: mockAdd,
    getJob: mockGetJob,
    getJobCounts: mockGetJobCounts
  }))
}))

// Create mock functions
const mockAdd = vi.fn()
const mockGetJob = vi.fn()
const mockGetJobCounts = vi.fn()

describe("Queue Producer", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock implementations
    mockAdd.mockResolvedValue({ id: "job-123" })
    mockGetJob.mockResolvedValue(null)
    mockGetJobCounts.mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 })
  })

  describe("queueProductReindex()", () => {
    it("should return job ID on successful enqueue", async () => {
      const jobId = await queueProductReindex(123)

      expect(jobId).toBe("job-123")
    })

    it("should include correct job type and productId", async () => {
      await queueProductReindex(456)

      expect(mockAdd).toHaveBeenCalledWith(
        "product_reindex",
        expect.objectContaining({
          type: "product_reindex",
          productId: 456
        }),
        expect.any(Object)
      )
    })

    it("should generate jobId with productId prefix", async () => {
      await queueProductReindex(789)

      expect(mockAdd).toHaveBeenCalledWith(
        "product_reindex",
        expect.any(Object),
        expect.objectContaining({
          jobId: expect.stringContaining("reindex-789-")
        })
      )
    })

    it("should not throw on queue failure", async () => {
      mockAdd.mockRejectedValueOnce(new Error("Connection failed"))

      // Should not throw, should return undefined
      const result = await queueProductReindex(999)

      expect(result).toBeUndefined()
    })

    it("should log error on failure", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockAdd.mockRejectedValueOnce(new Error("Test error"))

      await queueProductReindex(123)

      expect(consoleSpy).toHaveBeenCalled()
      expect(consoleSpy.mock.calls[0][0]).toContain("Failed to enqueue reindex job")
      consoleSpy.mockRestore()
    })
  })

  describe("getPendingJobCount()", () => {
    it("should return sum of waiting and active jobs", async () => {
      mockGetJobCounts.mockResolvedValue({ waiting: 5, active: 2 })

      const count = await getPendingJobCount()

      expect(count).toBe(7)
    })

    it("should return 0 when queue returns zeros", async () => {
      mockGetJobCounts.mockResolvedValue({ waiting: 0, active: 0 })

      const count = await getPendingJobCount()

      expect(count).toBe(0)
    })
  })

  describe("hasJob()", () => {
    it("should return true when job exists", async () => {
      mockGetJob.mockResolvedValue({ id: "job-123" })

      const result = await hasJob("job-123")

      expect(result).toBe(true)
    })

    it("should return false when job does not exist", async () => {
      mockGetJob.mockResolvedValue(null)

      const result = await hasJob("non-existent")

      expect(result).toBe(false)
    })
  })
})
