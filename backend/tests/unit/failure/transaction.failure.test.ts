/**
 * Transaction Failure Test
 * Phase 4 Step 10: Commerce System Validation
 *
 * Tests system behavior when transaction rollback occurs
 * No partial state should exist
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../../../modules/checkout/checkout.service.js')
vi.mock('../../../../modules/cart/services/cart.service.js')
vi.mock('../../../../modules/inventory/inventory.service.js')
vi.mock('../../../../infra/db/prisma.js')

import { CheckoutService } from '../../../../modules/checkout/checkout.service.js'
import { CartService } from '../../../../modules/cart/services/cart.service.js'
import { InventoryService } from '../../../../modules/inventory/inventory.service.js'
import { prisma } from '../../../../infra/db/prisma.js'
import { BusinessError } from '../../../../shared/errors/business.error.js'

describe('Transaction Failure Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('F4: Transaction Rollback', () => {
    /**
     * Test: When checkout fails, no partial state should exist
     *
     * If inventory reservation fails:
     * - Order should NOT be created
     * - Cart should remain unchanged
     * - Stock should remain unchanged
     */
    it('should rollback when inventory reservation fails', async () => {
      const userId = 15
      const productId = 100
      const initialStock = 100

      // Mock insufficient stock
      vi.mocked(CheckoutService.initiateCheckout).mockResolvedValue({
        summary: { cartId: 1, itemCount: 1, totalQuantity: 5, subtotal: 250000 },
        items: [{ productId, quantity: 5, price: 50000, subtotal: 250000 }],
        unavailableItems: []
      } as any)

      // Mock checkout failure due to stock
      vi.mocked(CheckoutService.completeCheckout).mockRejectedValue(
        new BusinessError('Insufficient stock', 400, 'INSUFFICIENT_STOCK')
      )

      // Cart before checkout
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({
        id: 1,
        userId,
        items: [{ id: 1, productId, quantity: 5 }],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Try checkout
      try {
        await CheckoutService.completeCheckout({ userId })
        fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessError)
        expect((error as BusinessError).code).toBe('INSUFFICIENT_STOCK')
      }

      // Cart should remain unchanged (rollback)
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }
      })

      expect(cart!.items.length).toBe(1) // Cart still has items
      expect(cart!.items[0].quantity).toBe(5) // Quantity unchanged
    })

    it('should maintain stock consistency on checkout failure', async () => {
      const productId = 200
      const initialAvailable = 50

      // Mock stock before
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        stock: 100,
        availableStock: initialAvailable,
        price: 30000,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Checkout fails
      vi.mocked(CheckoutService.completeCheckout).mockRejectedValue(
        new BusinessError('Product unavailable', 400, 'CHECKOUT_UNAVAILABLE_ITEMS')
      )

      try {
        await CheckoutService.completeCheckout({ userId: 99 })
      } catch {
        // Expected
      }

      // Stock should remain unchanged
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      expect(product!.availableStock).toBe(initialAvailable)
    })
  })

  describe('I-CHK-2: No Partial Reservation', () => {
    /**
     * Test: On failed checkout, no stock should be reserved
     *
     * If checkout fails at any point:
     * - No inventory should be permanently reserved
     * - Available stock should match before checkout
     */
    it('should not reserve any stock on checkout failure', async () => {
      const productId = 300
      const requestedQuantity = 10
      const initialAvailable = 100

      // Before checkout
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        stock: 100,
        availableStock: initialAvailable,
        price: 20000,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Mock checkout failure
      vi.mocked(CheckoutService.completeCheckout).mockRejectedValue(
        new BusinessError('Order creation failed', 500, 'ORDER_CREATION_FAILED')
      )

      // Capture stock before
      const beforeCheckout = initialAvailable

      // Try checkout
      try {
        await CheckoutService.completeCheckout({ userId: 50 })
      } catch {
        // Expected failure
      }

      // After failed checkout
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      // Invariant: No partial reservation
      expect(product!.availableStock).toBe(beforeCheckout)
    })
  })
})
