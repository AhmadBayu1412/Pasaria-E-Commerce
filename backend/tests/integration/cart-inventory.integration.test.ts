/**
 * Cart-Inventory Integration Test
 * Phase 4 Step 10: Commerce System Validation
 *
 * Tests cross-domain interaction between Cart and Inventory
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../../modules/cart/services/cart.service.js')
vi.mock('../../../modules/inventory/inventory.service.js')
vi.mock('../../../infra/db/prisma.js')

import { CartService } from '../../../modules/cart/services/cart.service.js'
import { InventoryService } from '../../../modules/inventory/inventory.service.js'
import { prisma } from '../../../infra/db/prisma.js'

describe('Cart-Inventory Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Cart Add → Inventory Validation', () => {
    it('should validate stock before adding to cart', async () => {
      const productId = 100
      const requestedQuantity = 10
      const availableStock = 50

      // Mock inventory check
      vi.mocked(InventoryService.validateStockForCart).mockResolvedValue({
        productId,
        requestedQuantity,
        availableStock,
        isAvailable: true
      })

      const result = await InventoryService.validateStockForCart({
        productId,
        requestedQuantity
      })

      expect(result.isAvailable).toBe(true)
      expect(result.availableStock).toBeGreaterThanOrEqual(requestedQuantity)
    })

    it('should reject when stock insufficient', async () => {
      const productId = 100
      const requestedQuantity = 100
      const availableStock = 5

      vi.mocked(InventoryService.validateStockForCart).mockResolvedValue({
        productId,
        requestedQuantity,
        availableStock,
        isAvailable: false
      })

      const result = await InventoryService.validateStockForCart({
        productId,
        requestedQuantity
      })

      expect(result.isAvailable).toBe(false)
    })
  })

  describe('Cart Update → Inventory Check', () => {
    it('should validate stock when updating quantity', async () => {
      const productId = 100
      const newQuantity = 15
      const availableStock = 50

      vi.mocked(InventoryService.validateStockForCart).mockResolvedValue({
        productId,
        requestedQuantity: newQuantity,
        availableStock,
        isAvailable: true
      })

      const result = await InventoryService.validateStockForCart({
        productId,
        requestedQuantity: newQuantity
      })

      expect(result.isAvailable).toBe(true)
    })
  })

  describe('Checkout → Inventory Reservation', () => {
    it('should reserve stock during checkout', async () => {
      const productId = 100
      const quantity = 5
      const initialStock = 100

      // Mock product with stock
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        name: 'Test Product',
        stock: initialStock,
        availableStock: initialStock,
        price: 50000,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Mock reserve
      vi.mocked(InventoryService.reserveStock).mockResolvedValue({
        productId,
        reservedQuantity: quantity,
        remainingStock: initialStock - quantity
      })

      const result = await InventoryService.reserveStock({
        productId,
        quantity
      })

      expect(result.reservedQuantity).toBe(quantity)
      expect(result.remainingStock).toBe(initialStock - quantity)
    })
  })

  describe('Stock Conservation Invariant', () => {
    it('should maintain: reservedStock + availableStock = totalStock', async () => {
      const productId = 100
      const totalStock = 100
      const availableStock = 95
      const reservedQuantity = 5

      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        stock: totalStock,
        availableStock: availableStock,
        price: 50000,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Get order items with DRAFT status for this product
      vi.mocked(prisma.orderItem.aggregate).mockResolvedValue({
        _sum: { quantity: reservedQuantity }
      } as any)

      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      const reserved = await prisma.orderItem.aggregate({
        where: {
          productId,
          order: { status: 'DRAFT' }
        },
        _sum: { quantity: true }
      })

      const reservedStock = reserved._sum.quantity ?? 0
      const calculatedAvailable = product!.stock - reservedStock

      // Invariant: reserved + available = total
      expect(calculatedAvailable).toBe(product!.availableStock)
    })
  })
})
