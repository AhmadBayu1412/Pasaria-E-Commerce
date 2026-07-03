// ============================================================
// CHECKOUT PREVIEW - INTEGRATION TESTS
// Phase 4 Step 5: Checkout Orchestration Foundation
//
// Tests full flow: Cart → Inventory → Checkout Preview
// Requires running server (start with: npm run dev)
// ============================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import request from "supertest"

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000"

describe("POST /checkout - Integration Tests", () => {
  // ============================================================
  // Test Data Setup
  // ============================================================
  let customerCookies: string[] = []
  let customerId: number = 0
  let testProductIds: number[] = []
  let sellerCookies: string[] = []

  beforeAll(async () => {
    // Login as customer
    try {
      const customerRes = await request(BASE_URL)
        .post("/auth/login")
        .send({ email: "customer@test.com", password: "Customer123!" })

      customerCookies = Array.isArray(customerRes.headers["set-cookie"])
        ? customerRes.headers["set-cookie"] as string[]
        : []

      if (customerRes.body?.data?.id) {
        customerId = customerRes.body.data.id
      }

      // Login as seller to create products
      const sellerRes = await request(BASE_URL)
        .post("/auth/login")
        .send({ email: "seller@test.com", password: "Seller123!" })

      sellerCookies = Array.isArray(sellerRes.headers["set-cookie"])
        ? sellerRes.headers["set-cookie"] as string[]
        : []

      // Create test products
      if (sellerCookies.length > 0) {
        for (let i = 0; i < 2; i++) {
          const productRes = await request(BASE_URL)
            .post("/products")
            .set("Cookie", sellerCookies)
            .send({
              name: `Checkout Test Product ${Date.now()}-${i}`,
              description: "Test product for checkout",
              basePrice: 10000 + i * 10000,
              price: 10000 + i * 10000,
              availableStock: 50 - i * 20,
            })

          if (productRes.status === 201) {
            testProductIds.push(productRes.body.data.id)
          }
        }
      }
    } catch (e) {
      console.log("Setup failed:", e)
    }
  })

  afterAll(async () => {
    // Cleanup handled by database
  })

  beforeEach(async () => {
    // Clear cart before each test
    if (customerCookies.length > 0) {
      await request(BASE_URL)
        .delete("/cart")
        .set("Cookie", customerCookies)
    }
  })

  describe("Success Scenarios", () => {
    it("should return 200 with checkout preview when cart has valid items", async () => {
      // Arrange: Add items to cart
      if (customerCookies.length > 0 && testProductIds.length >= 2) {
        await request(BASE_URL)
          .post("/cart/items")
          .set("Cookie", customerCookies)
          .send({ productId: testProductIds[0], quantity: 2 })

        await request(BASE_URL)
          .post("/cart/items")
          .set("Cookie", customerCookies)
          .send({ productId: testProductIds[1], quantity: 1 })
      }

      // Act
      const response = await request(BASE_URL)
        .post("/checkout")
        .set("Cookie", customerCookies)

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.summary.isReady).toBe(true)
      expect(response.body.data.summary.totalQuantity).toBe(3)
      expect(response.body.data.items).toHaveLength(2)
      expect(response.body.data.validation.passed).toBe(true)
      expect(response.body.data.validation.failedItems).toHaveLength(0)
    })

    it("should return 200 with single item cart", async () => {
      // Arrange: Add single item to cart
      if (customerCookies.length > 0 && testProductIds.length >= 1) {
        await request(BASE_URL)
          .post("/cart/items")
          .set("Cookie", customerCookies)
          .send({ productId: testProductIds[0], quantity: 1 })
      }

      // Act
      const response = await request(BASE_URL)
        .post("/checkout")
        .set("Cookie", customerCookies)

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.summary.isReady).toBe(true)
      expect(response.body.data.summary.totalQuantity).toBe(1)
    })
  })

  describe("Error Scenarios", () => {
    it("should return 400 CART_EMPTY when cart has no items", async () => {
      // Act
      const response = await request(BASE_URL)
        .post("/checkout")
        .set("Cookie", customerCookies)

      // Assert
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe("CART_EMPTY")
    })

    it("should return 400 CHECKOUT_UNAVAILABLE_ITEMS when item quantity exceeds stock", async () => {
      // Arrange: Add item with quantity exceeding stock
      if (customerCookies.length > 0 && testProductIds.length >= 1) {
        await request(BASE_URL)
          .post("/cart/items")
          .set("Cookie", customerCookies)
          .send({ productId: testProductIds[0], quantity: 999 }) // Exceeds stock
      }

      // Act
      const response = await request(BASE_URL)
        .post("/checkout")
        .set("Cookie", customerCookies)

      // Assert
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe("CHECKOUT_UNAVAILABLE_ITEMS")
    })

    it("should return 401 UNAUTHORIZED when not authenticated", async () => {
      // Act
      const response = await request(BASE_URL)
        .post("/checkout")

      // Assert
      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe("UNAUTHORIZED")
    })
  })
})
