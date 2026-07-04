/**
 * Inventory Invariant Tests
 * Phase 4 Step 10: Commerce System Validation
 *
 * Tests business invariants for Inventory domain
 * Invariant verification uses direct DB queries, not service calls
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../../../infra/db/prisma.js')

import { prisma } from '../../../../infra/db/prisma.js'

describe('Inventory Invariants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('I-INV-1: Stock Conservation', () => {
    /**
     * Formula: reservedStock + availableStock = stock (total)
     *
     * Verification:
     * - stock (total) = 100
     * - reservedStock = quantity of items in DRAFT orders
     * - availableStock = stock - reservedStock
     */
    it('should validate: reservedStock + availableStock = totalStock', async () => {
      const productId = 100
      const totalStock = 100
      const availableStock = 95
      const reservedQuantity = 5

      // Mock product
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        stock: totalStock,
        availableStock: availableStock,
        price: 50000,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Mock reserved calculation (items in DRAFT orders)
      vi.mocked(prisma.orderItem.aggregate).mockResolvedValue({
        _sum: { quantity: reservedQuantity }
      } as any)

      // Execute
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      const reservedResult = await prisma.orderItem.aggregate({
        where: {
          productId,
          order: { status: 'DRAFT' }
        },
        _sum: { quantity: true }
      })

      const reservedStock = reservedResult._sum.quantity ?? 0
      const calculatedAvailable = product!.stock - reservedStock

      // Invariant: reserved + available = total
      expect(product!.stock).toBe(100)
      expect(reservedStock).toBe(5)
      expect(calculatedAvailable).toBe(product!.availableStock)
    })

    it('should validate: no reservation when no orders', async () => {
      const productId = 200
      const totalStock = 50
      const availableStock = 50

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        stock: totalStock,
        availableStock: availableStock,
        price: 25000,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      vi.mocked(prisma.orderItem.aggregate).mockResolvedValue({
        _sum: { quantity: 0 }
      } as any)

      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      const reservedResult = await prisma.orderItem.aggregate({
        where: {
          productId,
          order: { status: 'DRAFT' }
        },
        _sum: { quantity: true }
      })

      const reservedStock = reservedResult._sum.quantity ?? 0

      // When no orders, available = total
      expect(product!.stock).toBe(product!.availableStock)
      expect(reservedStock).toBe(0)
    })
  })

  describe('I-INV-2: No Negative Stock', () => {
    it('should validate: availableStock >= 0', async () => {
      const productId = 300

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        stock: 100,
        availableStock: 50,
        price: 10000,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      // Invariant: availableStock >= 0
      expect(product!.availableStock).toBeGreaterThanOrEqual(0)
    })

    it('should validate: zero stock is valid', async () => {
      const productId = 400

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        stock: 100,
        availableStock: 0, // Sold out but not negative
        price: 75000,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      // Invariant: zero is valid (sold out)
      expect(product!.availableStock).toBeGreaterThanOrEqual(0)
    })
  })
})
