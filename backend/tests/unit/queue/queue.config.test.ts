import { describe, it, expect } from "vitest"
import { QUEUE_CONFIG } from "../../../shared/queue/queue.config.js"

describe("Queue Config", () => {
  it("should have correct queue name", () => {
    expect(QUEUE_CONFIG.QUEUE_NAME).toBe("product-queue")
  })

  describe("RETRY", () => {
    it("should have max attempts of 3", () => {
      expect(QUEUE_CONFIG.RETRY.MAX_ATTEMPTS).toBe(3)
    })

    it("should have initial delay of 1000ms", () => {
      expect(QUEUE_CONFIG.RETRY.INITIAL_DELAY).toBe(1000)
    })

    it("should have backoff multiplier of 2", () => {
      expect(QUEUE_CONFIG.RETRY.BACKOFF_MULTIPLIER).toBe(2)
    })
  })

  describe("JOB", () => {
    it("should have TTL of 86400 seconds (24 hours)", () => {
      expect(QUEUE_CONFIG.JOB.TTL).toBe(86400)
    })

    it("should keep 100 completed jobs", () => {
      expect(QUEUE_CONFIG.JOB.REMOVE_ON_COMPLETE).toBe(100)
    })

    it("should keep 500 failed jobs", () => {
      expect(QUEUE_CONFIG.JOB.REMOVE_ON_FAIL).toBe(500)
    })
  })

  describe("WORKER", () => {
    it("should have concurrency of 5", () => {
      expect(QUEUE_CONFIG.WORKER.CONCURRENCY).toBe(5)
    })

    it("should limit to 10 jobs per duration", () => {
      expect(QUEUE_CONFIG.WORKER.LIMITER_MAX).toBe(10)
    })

    it("should have limiter duration of 1000ms", () => {
      expect(QUEUE_CONFIG.WORKER.LIMITER_DURATION).toBe(1000)
    })
  })

  it("should have QUEUE_CONFIG defined", () => {
    expect(QUEUE_CONFIG).toBeDefined()
    expect(QUEUE_CONFIG.QUEUE_NAME).toBe("product-queue")
  })
})
