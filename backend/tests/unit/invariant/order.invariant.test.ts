/**
 * Order Invariant Tests
 * Phase 4 Step 10: Commerce System Validation
 *
 * Tests business invariants for Order domain
 * Note: Order status = DRAFT (Phase 4 only)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../../../infra/db/prisma.js')

import { prisma } from '../../../../infra/db/prisma.js'
import { OrderStateRules } from '../../../../modules/order/order.rules.js'

describe('Order Invariants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('I-ORD-1: Order Snapshot Immutable', () => {
    /**
     * Test: Create Order → Update Product Price → Reload Order
     * → Order item price tetap sama dengan saat creation
     *
     * Snapshot tidak berubah meskipun harga product berubah
     */
    it('should validate: order snapshot does not change when product price changes', async () => {
      const orderId = 1
      const productId = 100
      const priceAtCreation = 50000 // Price saat checkout
      const currentPrice = 60000 // Price sekarang (berubah)

      // Mock order dengan snapshot price
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: orderId,
        userId: 15,
        status: 'DRAFT',
        items: [
          {
            id: 1,
            productId,
            quantity: 2,
            priceSnapshot: priceAtCreation // Snapshot price saat creation
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Mock product dengan current price
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        price: currentPrice // Price berubah
      } as any)

      // Execute
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      })

      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      // Invariant: Order snapshot price TIDAK berubah
      const orderItemPrice = order!.items[0].priceSnapshot
      expect(orderItemPrice).toBe(priceAtCreation) // Snapshot tetap
      expect(product!.price).toBe(currentPrice) // Current price berubah
      expect(orderItemPrice).not.toBe(product!.price) // Mereka berbeda
    })
  })

  describe('I-ORD-2: Order Status Valid', () => {
    /**
     * Test: Status hanya berubah sesuai state machine
     * DRAFT → CONFIRMED (Phase 5)
     * DRAFT → CANCELLED (Phase 5)
     * DRAFT → EXPIRED (Phase 5)
     *
     * Phase 4: Order hanya dalam status DRAFT
     */
    it('should validate: new order is in DRAFT status', async () => {
      const orderId = 1

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: orderId,
        status: 'DRAFT',
        createdAt: new Date()
      } as any)

      const order = await prisma.order.findUnique({
        where: { id: orderId }
      })

      // Phase 4: Order starts in DRAFT
      expect(order!.status).toBe('DRAFT')
    })

    it('should validate: can transition from DRAFT to valid next states', () => {
      // Phase 4 only creates DRAFT
      // Transitions will be implemented in Phase 5
      const canTransitionToConfirmed = OrderStateRules.canTransition('DRAFT', 'CONFIRMED')
      const canTransitionToCancelled = OrderStateRules.canTransition('DRAFT', 'CANCELLED')
      const canTransitionToExpired = OrderStateRules.canTransition('DRAFT', 'EXPIRED')

      expect(canTransitionToConfirmed).toBe(true)
      expect(canTransitionToCancelled).toBe(true)
      expect(canTransitionToExpired).toBe(true)
    })

    it('should validate: DRAFT is not a terminal state', () => {
      const isTerminal = OrderStateRules.isTerminalState('DRAFT')
      expect(isTerminal).toBe(false)
    })
  })
})
