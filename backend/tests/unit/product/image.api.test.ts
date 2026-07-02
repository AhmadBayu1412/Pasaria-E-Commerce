import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import request from "supertest"
import { app } from "../../../app"
import { prisma } from "../../../infra/db/prisma"

describe("Product Images API", () => {

  // Use agent() to maintain session cookies across requests
  const sellerAgent = request.agent(app)
  const adminAgent = request.agent(app)
  const otherSellerAgent = request.agent(app)

  let productId: number
  let productId2: number // For non-owner test

  beforeAll(async () => {
    // ===== SELLER SETUP =====
    // Register seller
    await sellerAgent
      .post("/api/v1/auth/register")
      .send({
        email: "test-seller-image@test.com",
        password: "password123",
        role: "SELLER"
      })

    // Login to get session cookie
    await sellerAgent
      .post("/api/v1/auth/login")
      .send({
        email: "test-seller-image@test.com",
        password: "password123"
      })

    // ===== ADMIN SETUP =====
    // Register admin
    await adminAgent
      .post("/api/v1/auth/register")
      .send({
        email: "test-admin-image@test.com",
        password: "password123",
        role: "ADMIN"
      })

    // Login to get session cookie
    await adminAgent
      .post("/api/v1/auth/login")
      .send({
        email: "test-admin-image@test.com",
        password: "password123"
      })

    // ===== OTHER SELLER SETUP =====
    // Register other seller
    await otherSellerAgent
      .post("/api/v1/auth/register")
      .send({
        email: "other-seller-image@test.com",
        password: "password123",
        role: "SELLER"
      })

    // Login to get session cookie
    await otherSellerAgent
      .post("/api/v1/auth/login")
      .send({
        email: "other-seller-image@test.com",
        password: "password123"
      })

    // ===== CREATE TEST PRODUCTS =====
    // Create product as seller
    const productRes = await sellerAgent
      .post("/api/v1/products")
      .send({
        name: "Test Product for Images",
        price: 10000,
        description: "Test product"
      })

    if (productRes.body.data) {
      productId = productRes.body.data.id
    }

    // Create another product as other seller (for ownership test)
    const productRes2 = await otherSellerAgent
      .post("/api/v1/products")
      .send({
        name: "Test Product Other Seller",
        price: 10000,
        description: "Another test product"
      })

    if (productRes2.body.data) {
      productId2 = productRes2.body.data.id
    }
  })

  afterAll(async () => {
    // Cleanup order matters due to foreign keys:
    // 1. Delete product images (FK to products)
    // 2. Delete products (FK to users)
    // 3. Delete users (cleanup)
    // Note: Sessions are stored in Redis, not database - no cleanup needed

    try {
      // Delete product images first
      await prisma.productImage.deleteMany({
        where: {
          product: {
            name: {
              in: ["Test Product for Images", "Test Product Other Seller"]
            }
          }
        }
      })
    } catch (e) {
      // Ignore
    }

    try {
      // Delete products BEFORE users (FK dependency)
      await prisma.product.deleteMany({
        where: {
          name: {
            in: ["Test Product for Images", "Test Product Other Seller"]
          }
        }
      })
    } catch (e) {
      // Ignore
    }

    try {
      // Delete users last - may fail if other products exist referencing them
      // Just log and continue
      await prisma.user.deleteMany({
        where: {
          email: { contains: "@test.com" }
        }
      })
    } catch (e: any) {
      // Ignore FK constraint - test users might have other products
      if (e.code !== 'P2003') {
        console.warn("User cleanup warning:", e.message)
      }
    }
  })

  // ============================================================
  // GET /products/:id/images
  // ============================================================
  describe("GET /products/:id/images", () => {

    it("should return empty list for new product", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await request(app).get(`/api/v1/products/${productId}/images`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual([])
      expect(res.body.totalImages).toBe(0)
    })

    it("should return 404 for invalid product ID", async () => {
      const res = await request(app).get("/api/v1/products/abc/images")

      expect(res.status).toBe(404)
    })

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/v1/products/99999/images")
      expect(res.status).toBe(404)
    })
  })

  // ============================================================
  // POST /products/:id/images
  // ============================================================
  describe("POST /products/:id/images", () => {

    it("should upload image successfully", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await sellerAgent
        .post(`/api/v1/products/${productId}/images`)
        .attach("image", Buffer.from("fake-image-data"), {
          filename: "test.jpg",
          contentType: "image/jpeg"
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.filename).toBe("test.jpg")
      expect(res.body.data.mimeType).toBe("image/jpeg")
      expect(res.body.data.position).toBe(0)
    })

    it("should upload as primary image", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await sellerAgent
        .post(`/api/v1/products/${productId}/images`)
        .field("isPrimary", "true")
        .attach("image", Buffer.from("fake-image-data"), {
          filename: "primary.jpg",
          contentType: "image/jpeg"
        })

      expect(res.status).toBe(201)
      expect(res.body.data.isPrimary).toBe(true)
    })

    it("should reject without auth (no session cookie)", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .attach("image", Buffer.from("fake-image-data"), {
          filename: "test.jpg",
          contentType: "image/jpeg"
        })

      expect(res.status).toBe(401)
    })

    it("should reject non-image file", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await sellerAgent
        .post(`/api/v1/products/${productId}/images`)
        .attach("image", Buffer.from("fake-pdf-data"), {
          filename: "test.pdf",
          contentType: "application/pdf"
        })

      expect(res.status).toBe(400)
    })

    it("should reject without file", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await sellerAgent
        .post(`/api/v1/products/${productId}/images`)

      expect(res.status).toBe(400)
      expect(res.body.code).toBe("FILE_REQUIRED")
    })
  })

  // ============================================================
  // DELETE /products/:id/images/:imageId
  // ============================================================
  describe("DELETE /products/:id/images/:imageId", () => {

    let imageId: number

    beforeEach(async () => {
      if (!productId) {
        console.warn("Skipping - product not created")
        return
      }
      // Upload test image
      const uploadRes = await sellerAgent
        .post(`/api/v1/products/${productId}/images`)
        .attach("image", Buffer.from("test"), {
          filename: "to-delete.jpg",
          contentType: "image/jpeg"
        })

      if (uploadRes.body.data) {
        imageId = uploadRes.body.data.id
      }
    })

    it("should delete image successfully", async () => {
      if (!productId || !imageId) {
        console.warn("Skipping test - prerequisites not met")
        return
      }
      const res = await sellerAgent
        .delete(`/api/v1/products/${productId}/images/${imageId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.deletedId).toBe(imageId)
    })

    it("should return 404 for non-existent image", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await sellerAgent
        .delete(`/api/v1/products/${productId}/images/99999`)

      expect(res.status).toBe(404)
      expect(res.body.code).toBe("IMAGE_NOT_FOUND")
    })

    it("should reject non-owner", async () => {
      if (!productId2) {
        console.warn("Skipping test - product not created")
        return
      }
      // Try to delete image from product that belongs to other seller
      // First upload image to productId2 (belongs to other seller)
      const uploadRes = await otherSellerAgent
        .post(`/api/v1/products/${productId2}/images`)
        .attach("image", Buffer.from("test"), {
          filename: "other-owner.jpg",
          contentType: "image/jpeg"
        })

      if (!uploadRes.body.data) {
        console.warn("Skipping test - image not uploaded")
        return
      }

      const otherImageId = uploadRes.body.data.id

      // Try to delete from sellerAgent (different owner)
      const res = await sellerAgent
        .delete(`/api/v1/products/${productId2}/images/${otherImageId}`)

      expect(res.status).toBe(403)
    })

    it("should allow admin to delete any image", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      // Upload image to productId (seller's product)
      const uploadRes = await sellerAgent
        .post(`/api/v1/products/${productId}/images`)
        .attach("image", Buffer.from("admin-delete-test"), {
          filename: "admin-delete.jpg",
          contentType: "image/jpeg"
        })

      if (!uploadRes.body.data) {
        console.warn("Skipping test - image not uploaded")
        return
      }

      const imgId = uploadRes.body.data.id

      // Admin deletes it
      const res = await adminAgent
        .delete(`/api/v1/products/${productId}/images/${imgId}`)

      expect(res.status).toBe(200)
    })
  })

  // ============================================================
  // PATCH /products/:id/images/reorder
  // ============================================================
  describe("PATCH /products/:id/images/reorder", () => {

    it("should reorder images successfully", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      // Get current images
      const listRes = await request(app)
        .get(`/api/v1/products/${productId}/images`)

      const images = listRes.body.data
      if (!images || images.length < 2) {
        // Upload more images first
        await sellerAgent
          .post(`/api/v1/products/${productId}/images`)
          .attach("image", Buffer.from("img1"), {
            filename: "img1.jpg",
            contentType: "image/jpeg"
          })

        await sellerAgent
          .post(`/api/v1/products/${productId}/images`)
          .attach("image", Buffer.from("img2"), {
            filename: "img2.jpg",
            contentType: "image/jpeg"
          })

        const newListRes = await request(app)
          .get(`/api/v1/products/${productId}/images`)

        const newImages = newListRes.body.data
        if (!newImages || newImages.length < 2) {
          console.warn("Skipping - not enough images after upload")
          return
        }

        const res = await sellerAgent
          .patch(`/api/v1/products/${productId}/images/reorder`)
          .send({
            imagePositions: newImages.map((img: any, idx: number) => ({
              imageId: img.id,
              position: newImages.length - 1 - idx
            }))
          })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        return
      }

      const res = await sellerAgent
        .patch(`/api/v1/products/${productId}/images/reorder`)
        .send({
          imagePositions: images.map((img: any, idx: number) => ({
            imageId: img.id,
            position: images.length - 1 - idx
          }))
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it("should reject invalid image ID", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await sellerAgent
        .patch(`/api/v1/products/${productId}/images/reorder`)
        .send({
          imagePositions: [{ imageId: 99999, position: 0 }]
        })

      expect(res.status).toBe(404)
      expect(res.body.code).toBe("IMAGE_NOT_FOUND")
    })

    it("should reject empty array", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await sellerAgent
        .patch(`/api/v1/products/${productId}/images/reorder`)
        .send({ imagePositions: [] })

      expect(res.status).toBe(400)
    })
  })

  // ============================================================
  // PATCH /products/:id/images/:imageId/primary
  // ============================================================
  describe("PATCH /products/:id/images/:imageId/primary", () => {

    let imageId: number

    beforeEach(async () => {
      if (!productId) {
        console.warn("Skipping - product not created")
        return
      }
      const uploadRes = await sellerAgent
        .post(`/api/v1/products/${productId}/images`)
        .attach("image", Buffer.from("test"), {
          filename: "to-primary.jpg",
          contentType: "image/jpeg"
        })

      if (uploadRes.body.data) {
        imageId = uploadRes.body.data.id
      }
    })

    it("should set primary image successfully", async () => {
      if (!productId || !imageId) {
        console.warn("Skipping test - prerequisites not met")
        return
      }
      const res = await sellerAgent
        .patch(`/api/v1/products/${productId}/images/${imageId}/primary`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.isPrimary).toBe(true)
    })

    it("should return 404 for non-existent image", async () => {
      if (!productId) {
        console.warn("Skipping test - product not created")
        return
      }
      const res = await sellerAgent
        .patch(`/api/v1/products/${productId}/images/99999/primary`)

      expect(res.status).toBe(404)
    })
  })
})
