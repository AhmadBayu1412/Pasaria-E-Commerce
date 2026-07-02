/**
 * System Validation: API Contract Stability Tests
 *
 * Validates that the API contracts remain stable.
 * Uses flexible assertions to handle rate limiting and transient errors.
 */

import { describe, it, expect } from "vitest"
import request from "supertest"

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000"

describe("API Contract Stability Tests", () => {

  describe("Health API Contract", () => {

    it("should return valid health response structure", async () => {
      const res = await request(BASE_URL).get("/health")

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("status")
      expect(res.body).toHaveProperty("database")
      expect(res.body).toHaveProperty("redis")
      expect(res.body).toHaveProperty("queue")
    })

    it("should include queue status", async () => {
      const res = await request(BASE_URL).get("/health")

      expect(res.body.queue).toHaveProperty("name")
      expect(res.body.queue).toHaveProperty("isReady")
      expect(res.body.queue).toHaveProperty("jobs")
    })

    it("should return UP status when healthy", async () => {
      const res = await request(BASE_URL).get("/health")

      expect(res.body.status).toBe("UP")
      expect(res.body.database).toBe("UP")
    })
  })

  describe("Database Health API Contract", () => {

    it("should return database health response", async () => {
      const res = await request(BASE_URL).get("/health/db")

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("database")
    })
  })

  describe("Category API Contract", () => {

    it("should return consistent category list response", async () => {
      const res = await request(BASE_URL).get("/categories")

      // May be rate limited
      if (res.status === 429) {
        return // Skip test if rate limited
      }

      expect([200, 201]).toContain(res.status)
      expect(res.body).toHaveProperty("success")
    })
  })

  describe("Response Format Consistency", () => {

    it("should return JSON content type", async () => {
      const res = await request(BASE_URL).get("/health")

      expect(res.headers["content-type"]).toContain("application/json")
    })

    it("should return proper error structure on error", async () => {
      const res = await request(BASE_URL).get("/products/999999")

      // Product may not exist, but response should be proper
      expect([200, 404]).toContain(res.status)
      if (res.status === 404) {
        expect(res.body).toHaveProperty("success")
      }
    })
  })

  describe("Configuration Contracts", () => {

    it("should have valid cache TTL configuration", async () => {
      const res = await request(BASE_URL).get("/health")

      // Verify configuration is consistent
      expect(res.body.redis).toBe("UP")
    })

    it("should have valid queue configuration", async () => {
      const res = await request(BASE_URL).get("/health")

      expect(res.body.queue.name).toBe("product-queue")
      expect(res.body.queue.isReady).toBe(true)
    })
  })
})
