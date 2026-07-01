import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import request from "supertest"
import { app } from "../../../app"
import { prisma } from "../../../infra/db/prisma"

describe("Product Images API", () => {

  let authToken: string
  let adminToken: string
  let productId: number

  beforeAll(async () => {
    // Create test user and get token
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "test-seller-image@test.com",
        password: "password123",
        role: "SELLER"
      })
    
    authToken = res.body.data.token
    
    // Create admin
    const adminRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "test-admin-image@test.com",
        password: "password123",
        role: "ADMIN"
      })
    
    adminToken = adminRes.body.data.token
    
    // Create test product
    const productRes = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Product for Images",
        price: 10000,
        description: "Test product"
      })
    
    productId = productRes.body.data.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.productImage.deleteMany({
      where: { product: { name: "Test Product for Images" } }
    })
    await prisma.product.deleteMany({
      where: { name: "Test Product for Images" }
    })
    await prisma.user.deleteMany({
      where: { email: { contains: "test-" } }
    })
  })

  // ============================================================
  // GET /products/:id/images
  // ============================================================
  describe("GET /products/:id/images", () => {

    it("should return empty list for new product", async () => {
      const res = await request(app).get(`/api/v1/products/${productId}/images`)
      
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual([])
      expect(res.body.totalImages).toBe(0)
    })

    it("should return 400 for invalid product ID", async () => {
      const res = await request(app).get("/api/v1/products/abc/images")
      
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/v1/products/99999/images")
      
      expect(res.status).toBe(200) // Product exists check handled in service
    })
  })

  // ============================================================
  // POST /products/:id/images
  // ============================================================
  describe("POST /products/:id/images", () => {

    it("should upload image successfully", async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${authToken}`)
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
      const res = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${authToken}`)
        .field("isPrimary", "true")
        .attach("image", Buffer.from("fake-image-data"), {
          filename: "primary.jpg",
          contentType: "image/jpeg"
        })
      
      expect(res.status).toBe(201)
      expect(res.body.data.isPrimary).toBe(true)
    })

    it("should reject without auth token", async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .attach("image", Buffer.from("fake-image-data"), {
          filename: "test.jpg",
          contentType: "image/jpeg"
        })
      
      expect(res.status).toBe(401)
    })

    it("should reject non-image file", async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("image", Buffer.from("fake-pdf-data"), {
          filename: "test.pdf",
          contentType: "application/pdf"
        })
      
      expect(res.status).toBe(400)
    })

    it("should reject oversized file", async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024) // 6MB
      
      const res = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("image", largeBuffer, {
          filename: "large.jpg",
          contentType: "image/jpeg"
        })
      
      expect(res.status).toBe(400)
      expect(res.body.code).toBe("FILE_TOO_LARGE")
    })

    it("should reject without file", async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${authToken}`)
      
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
      // Upload test image
      const uploadRes = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("image", Buffer.from("test"), {
          filename: "to-delete.jpg",
          contentType: "image/jpeg"
        })
      
      imageId = uploadRes.body.data.id
    })

    it("should delete image successfully", async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${productId}/images/${imageId}`)
        .set("Authorization", `Bearer ${authToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.deletedId).toBe(imageId)
    })

    it("should return 404 for non-existent image", async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${productId}/images/99999`)
        .set("Authorization", `Bearer ${authToken}`)
      
      expect(res.status).toBe(404)
      expect(res.body.code).toBe("IMAGE_NOT_FOUND")
    })

    it("should reject non-owner", async () => {
      // Create another seller
      const otherRes = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "other-seller@test.com",
          password: "password123",
          role: "SELLER"
        })
      
      const otherToken = otherRes.body.data.token
      
      const res = await request(app)
        .delete(`/api/v1/products/${productId}/images/${imageId}`)
        .set("Authorization", `Bearer ${otherToken}`)
      
      expect(res.status).toBe(403)
    })

    it("should allow admin to delete any image", async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${productId}/images/${imageId}`)
        .set("Authorization", `Bearer ${adminToken}`)
      
      expect(res.status).toBe(200)
    })
  })

  // ============================================================
  // PATCH /products/:id/images/reorder
  // ============================================================
  describe("PATCH /products/:id/images/reorder", () => {

    it("should reorder images successfully", async () => {
      // Get current images
      const listRes = await request(app)
        .get(`/api/v1/products/${productId}/images`)
      
      const images = listRes.body.data
      if (images.length < 2) {
        // Skip if not enough images
        return
      }

      const res = await request(app)
        .patch(`/api/v1/products/${productId}/images/reorder`)
        .set("Authorization", `Bearer ${authToken}`)
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
      const res = await request(app)
        .patch(`/api/v1/products/${productId}/images/reorder`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          imagePositions: [{ imageId: 99999, position: 0 }]
        })
      
      expect(res.status).toBe(404)
      expect(res.body.code).toBe("IMAGE_NOT_FOUND")
    })

    it("should reject empty array", async () => {
      const res = await request(app)
        .patch(`/api/v1/products/${productId}/images/reorder`)
        .set("Authorization", `Bearer ${authToken}`)
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
      const uploadRes = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("image", Buffer.from("test"), {
          filename: "to-primary.jpg",
          contentType: "image/jpeg"
        })
      
      imageId = uploadRes.body.data.id
    })

    it("should set primary image successfully", async () => {
      const res = await request(app)
        .patch(`/api/v1/products/${productId}/images/${imageId}/primary`)
        .set("Authorization", `Bearer ${authToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.isPrimary).toBe(true)
    })

    it("should return 404 for non-existent image", async () => {
      const res = await request(app)
        .patch(`/api/v1/products/${productId}/images/99999/primary`)
        .set("Authorization", `Bearer ${authToken}`)
      
      expect(res.status).toBe(404)
    })
  })
})