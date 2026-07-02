import { describe, it, expect, vi, beforeEach } from "vitest"
import { handleProductReindex } from "../../../infra/queue/jobs/product.job.js"

describe("Product Job Handler", () => {

  describe("handleProductReindex()", () => {
    it("should process valid reindex job successfully", async () => {
      const mockJob = {
        id: "job-123",
        data: {
          type: "product_reindex",
          productId: 123,
          timestamp: Date.now()
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
        processingTime: 0
      }

      await expect(handleProductReindex(mockJob as any)).resolves.not.toThrow()
    })

    it("should use productId from job data", async () => {
      const productId = 456
      const mockJob = {
        id: "job-456",
        data: {
          type: "product_reindex",
          productId,
          timestamp: Date.now()
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
        processingTime: 0
      }

      // Should complete without error
      await expect(handleProductReindex(mockJob as any)).resolves.not.toThrow()
    })

    it("should log processing start", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const mockJob = {
        id: "job-789",
        data: {
          type: "product_reindex",
          productId: 789,
          timestamp: Date.now()
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
        processingTime: 0
      }

      await handleProductReindex(mockJob as any)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Processing product_reindex")
      )
      consoleSpy.mockRestore()
    })

    it("should log completion", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const mockJob = {
        id: "job-101",
        data: {
          type: "product_reindex",
          productId: 101,
          timestamp: Date.now()
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
        processingTime: 0
      }

      await handleProductReindex(mockJob as any)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Completed product_reindex")
      )
      consoleSpy.mockRestore()
    })

    it("should throw on invalid productId type", async () => {
      const mockJob = {
        id: "job-invalid",
        data: {
          type: "product_reindex",
          productId: "invalid" // Should be number
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
        processingTime: 0
      }

      await expect(handleProductReindex(mockJob as any)).rejects.toThrow()
    })

    it("should throw on missing productId", async () => {
      const mockJob = {
        id: "job-missing",
        data: {
          type: "product_reindex"
          // productId missing
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
        processingTime: 0
      }

      await expect(handleProductReindex(mockJob as any)).rejects.toThrow()
    })

    it("should track attempt number", async () => {
      const mockJob = {
        id: "job-retry",
        data: {
          type: "product_reindex",
          productId: 999,
          timestamp: Date.now()
        },
        attemptsMade: 2, // Third attempt
        opts: { attempts: 3 },
        processingTime: 0
      }

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await handleProductReindex(mockJob as any)

      // Should log attempt 3
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("3/3")
      )
      consoleSpy.mockRestore()
    })
  })
})
