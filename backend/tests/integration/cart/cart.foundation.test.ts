// ============================================================
// CART FOUNDATION INTEGRATION TESTS
// Phase 4 Step 1
// NOTE: Requires running database
// ============================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { prisma } from "../../../infra/db/prisma.js"

describe("Cart Foundation Integration", () => {

  // Clean up after all tests
  afterAll(async () => {
    // Cleanup test data - delete in reverse order of creation
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          user: {
            email: { contains: "@test-cart-" },
          },
        },
      },
    })
    await prisma.cart.deleteMany({
      where: {
        user: {
          email: { contains: "@test-cart-" },
        },
      },
    })
    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: { contains: "@test-cart-" },
      },
    })
    // Delete test sellers
    await prisma.user.deleteMany({
      where: {
        email: { contains: "@test-seller-" },
      },
    })
  })

  // ============================================================
  // Schema Constraint Tests
  // ============================================================
  describe("Schema Constraints", () => {

    it("should enforce unique userId on Cart", async () => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: `unique-user-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })

      // Create first cart
      const cart1 = await prisma.cart.create({
        data: { userId: user.id },
      })

      // Attempt to create second cart for same user should fail
      await expect(
        prisma.cart.create({
          data: { userId: user.id },
        })
      ).rejects.toThrow()

      // Cleanup
      await prisma.cart.delete({ where: { id: cart1.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    it("should enforce unique cartId+productId on CartItem", async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          email: `unique-item-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })
      const seller = await prisma.user.create({
        data: {
          email: `seller-unique-${Date.now()}@test-seller.com`,
          passwordHash: "hashed",
          role: "SELLER",
        },
      })
      const cart = await prisma.cart.create({ data: { userId: user.id } })
      const product = await prisma.product.create({
        data: {
          name: "Test Product",
          basePrice: 100,
          sellerId: seller.id,
        },
      })

      // Create first cart item
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity: 1 },
      })

      // Attempt to add same product again should fail
      await expect(
        prisma.cartItem.create({
          data: { cartId: cart.id, productId: product.id, quantity: 2 },
        })
      ).rejects.toThrow()

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
      await prisma.product.delete({ where: { id: product.id } })
      await prisma.user.deleteMany({
        where: { id: { in: [user.id, seller.id] } },
      })
    })

    it("should cascade delete CartItems when Cart is deleted", async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          email: `cascade-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })
      const seller = await prisma.user.create({
        data: {
          email: `seller-cascade-${Date.now()}@test-seller.com`,
          passwordHash: "hashed",
          role: "SELLER",
        },
      })
      const cart = await prisma.cart.create({ data: { userId: user.id } })

      // Create multiple products (different products for different items)
      const product1 = await prisma.product.create({
        data: {
          name: "Test Product 1",
          basePrice: 100,
          sellerId: seller.id,
        },
      })
      const product2 = await prisma.product.create({
        data: {
          name: "Test Product 2",
          basePrice: 200,
          sellerId: seller.id,
        },
      })

      // Add multiple items with different products
      await prisma.cartItem.createMany({
        data: [
          { cartId: cart.id, productId: product1.id, quantity: 1 },
          { cartId: cart.id, productId: product2.id, quantity: 2 },
        ],
      })

      // Verify items exist
      const itemsBefore = await prisma.cartItem.count({
        where: { cartId: cart.id },
      })
      expect(itemsBefore).toBe(2)

      // Delete cart
      await prisma.cart.delete({ where: { id: cart.id } })

      // Verify items are deleted (cascade)
      const itemsAfter = await prisma.cartItem.count({
        where: { cartId: cart.id },
      })
      expect(itemsAfter).toBe(0)

      // Cleanup
      await prisma.product.deleteMany({ where: { id: { in: [product1.id, product2.id] } } })
      await prisma.user.deleteMany({
        where: { id: { in: [user.id, seller.id] } },
      })
    })

    it("should restrict Product deletion when referenced by CartItem", async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          email: `restrict-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })
      const seller = await prisma.user.create({
        data: {
          email: `seller-restrict-${Date.now()}@test-seller.com`,
          passwordHash: "hashed",
          role: "SELLER",
        },
      })
      const cart = await prisma.cart.create({ data: { userId: user.id } })
      const product = await prisma.product.create({
        data: {
          name: "Protected Product",
          basePrice: 100,
          sellerId: seller.id,
        },
      })

      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity: 1 },
      })

      // Attempt to delete product should fail due to FK constraint (no ON DELETE)
      await expect(
        prisma.product.delete({ where: { id: product.id } })
      ).rejects.toThrow()

      // Cleanup - delete cart first (cascade deletes items), then product
      await prisma.cart.delete({ where: { id: cart.id } })
      await prisma.product.delete({ where: { id: product.id } })
      await prisma.user.deleteMany({
        where: { id: { in: [user.id, seller.id] } },
      })
    })
  })

  // ============================================================
  // Entity Relation Tests
  // ============================================================
  describe("Entity Relations", () => {

    it("should correctly traverse User → Cart → CartItems → Product", async () => {
      // Create full hierarchy
      const user = await prisma.user.create({
        data: {
          email: `hierarchy-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })
      const seller = await prisma.user.create({
        data: {
          email: `seller-hierarchy-${Date.now()}@test-seller.com`,
          passwordHash: "hashed",
          role: "SELLER",
        },
      })
      const cart = await prisma.cart.create({ data: { userId: user.id } })
      const product = await prisma.product.create({
        data: {
          name: "Hierarchy Product",
          basePrice: 100,
          sellerId: seller.id,
        },
      })

      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity: 3 },
      })

      // Test traversal
      const fullCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          user: true,
          items: {
            include: { product: true },
          },
        },
      })

      expect(fullCart).not.toBeNull()
      expect(fullCart?.user.email).toBe(user.email)
      expect(fullCart?.items).toHaveLength(1)
      expect(fullCart?.items[0].product.name).toBe("Hierarchy Product")
      expect(fullCart?.items[0].quantity).toBe(3)

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
      await prisma.product.delete({ where: { id: product.id } })
      await prisma.user.deleteMany({
        where: { id: { in: [user.id, seller.id] } },
      })
    })

    it("should return cart with empty items when cart is new", async () => {
      // Create user with new cart
      const user = await prisma.user.create({
        data: {
          email: `empty-cart-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })
      const cart = await prisma.cart.create({ data: { userId: user.id } })

      // Get cart with items
      const fullCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      expect(fullCart).not.toBeNull()
      expect(fullCart?.items).toHaveLength(0)
      expect(fullCart?.items).toEqual([])

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    it("should allow multiple CartItems for different products in same Cart", async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          email: `multi-item-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })
      const seller = await prisma.user.create({
        data: {
          email: `seller-multi-${Date.now()}@test-seller.com`,
          passwordHash: "hashed",
          role: "SELLER",
        },
      })
      const cart = await prisma.cart.create({ data: { userId: user.id } })

      // Create multiple products
      const product1 = await prisma.product.create({
        data: {
          name: "Product 1",
          basePrice: 100,
          sellerId: seller.id,
        },
      })
      const product2 = await prisma.product.create({
        data: {
          name: "Product 2",
          basePrice: 200,
          sellerId: seller.id,
        },
      })
      const product3 = await prisma.product.create({
        data: {
          name: "Product 3",
          basePrice: 300,
          sellerId: seller.id,
        },
      })

      // Add different products to cart
      await prisma.cartItem.createMany({
        data: [
          { cartId: cart.id, productId: product1.id, quantity: 2 },
          { cartId: cart.id, productId: product2.id, quantity: 3 },
          { cartId: cart.id, productId: product3.id, quantity: 1 },
        ],
      })

      // Verify
      const cartWithItems = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      expect(cartWithItems?.items).toHaveLength(3)

      // Verify quantities
      const quantities = cartWithItems?.items.map(i => i.quantity).sort()
      expect(quantities).toEqual([1, 2, 3])

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
      await prisma.product.deleteMany({ where: { id: { in: [product1.id, product2.id, product3.id] } } })
      await prisma.user.deleteMany({
        where: { id: { in: [user.id, seller.id] } },
      })
    })
  })

  // ============================================================
  // Computed Fields Tests
  // ============================================================
  describe("Computed Fields", () => {

    it("should compute itemCount correctly", async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          email: `computed-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })
      const seller = await prisma.user.create({
        data: {
          email: `seller-computed-${Date.now()}@test-seller.com`,
          passwordHash: "hashed",
          role: "SELLER",
        },
      })
      const cart = await prisma.cart.create({ data: { userId: user.id } })

      // Create products
      const products = await Promise.all([
        prisma.product.create({
          data: { name: "P1", basePrice: 100, sellerId: seller.id },
        }),
        prisma.product.create({
          data: { name: "P2", basePrice: 100, sellerId: seller.id },
        }),
        prisma.product.create({
          data: { name: "P3", basePrice: 100, sellerId: seller.id },
        }),
      ])

      // Add items
      await prisma.cartItem.createMany({
        data: [
          { cartId: cart.id, productId: products[0].id, quantity: 5 },
          { cartId: cart.id, productId: products[1].id, quantity: 3 },
          { cartId: cart.id, productId: products[2].id, quantity: 2 },
        ],
      })

      // Get cart and verify computed fields
      const cartWithItems = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      // itemCount = items.length
      expect(cartWithItems?.items.length).toBe(3)

      // totalQuantity = sum of quantities
      const totalQuantity = cartWithItems?.items.reduce((sum, i) => sum + i.quantity, 0)
      expect(totalQuantity).toBe(10)

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
      await prisma.product.deleteMany({ where: { id: { in: products.map(p => p.id) } } })
      await prisma.user.deleteMany({
        where: { id: { in: [user.id, seller.id] } },
      })
    })
  })

  // ============================================================
  // Lazy Creation Tests
  // ============================================================
  describe("Lazy Creation", () => {

    it("should allow user to exist without cart initially", async () => {
      // Create user without cart
      const user = await prisma.user.create({
        data: {
          email: `lazy-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })

      // User should have no cart
      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
      })

      expect(cart).toBeNull()

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })

    it("should create cart only when explicitly created", async () => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: `explicit-${Date.now()}@test-cart.com`,
          passwordHash: "hashed",
          role: "CUSTOMER",
        },
      })

      // Initially no cart
      expect(
        await prisma.cart.findUnique({ where: { userId: user.id } })
      ).toBeNull()

      // Explicitly create cart
      const cart = await prisma.cart.create({
        data: { userId: user.id },
      })

      // Now cart exists
      const foundCart = await prisma.cart.findUnique({
        where: { userId: user.id },
      })

      expect(foundCart).not.toBeNull()
      expect(foundCart?.id).toBe(cart.id)

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })
})
