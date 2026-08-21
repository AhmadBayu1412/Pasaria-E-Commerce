// ============================================================
// CHECKOUT SERVICE — Application Orchestrator (Vercel Synchronous Serverless)
// ============================================================

import { prisma } from "../../infra/db/prisma"
import { CartService } from "../cart/services/cart.service"
import { InventoryService } from "../inventory/inventory.service"
import { getProductForSnapshot } from "../product/services/product.service"
import { CheckoutRules } from "./checkout.rules"
import { OrderService } from "../order/order.service"
import { BusinessError } from "../../shared/errors/business.error"
import type {
  InitiateCheckoutInput,
  CheckoutPreview,
  CompleteCheckoutInput,
  CompleteCheckoutResult,
} from "./checkout.types"

// ----- Shipping Options -----
const SHIPPING_OPTIONS: Array<{ id: string; name: string; price: number }> = [
  { id: "jne_reg", name: "JNE Regular", price: 15000 },
  { id: "jne_yes", name: "JNE YES", price: 35000 },
  { id: "pos_kilat", name: "Pos Kilat", price: 20000 },
  { id: "tiki_reg", name: "TIKI Regular", price: 18000 },
  { id: "grab_express", name: "GrabExpress", price: 25000 },
]

// ----- Payment Methods -----
const PAYMENT_METHODS: Array<{ id: string; name: string; fee: number }> = [
  { id: "bca_va", name: "BCA Virtual Account", fee: 4000 },
  { id: "mandiri_va", name: "Mandiri Virtual Account", fee: 4000 },
  { id: "bni_va", name: "BNI Virtual Account", fee: 4000 },
  { id: "bri_va", name: "BRI Virtual Account", fee: 4000 },
  { id: "gopay", name: "GoPay", fee: 2000 },
  { id: "ovo", name: "OVO", fee: 2000 },
  { id: "dana", name: "DANA", fee: 2000 },
  { id: "credit_card", name: "Kartu Kredit", fee: 2.9 },
  { id: "indomaret", name: "Indomaret", fee: 2500 },
  { id: "alfamart", name: "Alfamart", fee: 2500 },
  { id: "qris", name: "QRIS", fee: 0 },
]

function getShippingOption(shippingId?: string) {
  if (!shippingId) return null
  return SHIPPING_OPTIONS.find((s) => s.id === shippingId) || null
}

function getPaymentMethod(paymentId?: string) {
  if (!paymentId) return null
  return PAYMENT_METHODS.find((p) => p.id === paymentId) || null
}

export const CheckoutService = {
  async initiateCheckout(input: InitiateCheckoutInput): Promise<CheckoutPreview> {
    const { userId } = input

    const cartSnapshot = await CartService.getCartSnapshot(userId)
    CheckoutRules.assertCartNotEmpty(cartSnapshot.totalQuantity)

    const itemResults = await Promise.all(
      cartSnapshot.items.map(async (item) => {
        const stockResult = await InventoryService.validateCartItemForCheckout({
          productId: item.productId,
          quantity: item.quantity,
        })

        const product = await getProductForSnapshot(item.productId)
        const unitPriceNum = Number(product.basePrice)
        const subtotalNum = unitPriceNum * item.quantity

        return {
          productId: item.productId,
          productName: product.name,
          productImage: product.imageUrl,
          unitPrice: unitPriceNum,
          quantity: item.quantity,
          availableStock: stockResult.availableStock,
          subtotal: subtotalNum,
          status: stockResult.status,
          reason: stockResult.reason,
        }
      })
    )

    const failedItems = itemResults
      .filter((r) => r.status === "INVALID")
      .map((r) => r.productId)

    const passed = failedItems.length === 0
    const totalQuantity = itemResults.reduce((sum, i) => sum + i.quantity, 0)
    const totalItemCount = itemResults.length
    const subtotal = itemResults.reduce((sum, i) => sum + Number(i.subtotal), 0)

    if (!passed) {
      throw new BusinessError(
        `Some items are unavailable: ${failedItems.join(", ")}`,
        400,
        "CHECKOUT_UNAVAILABLE_ITEMS"
      )
    }

    return {
      summary: {
        cartId: cartSnapshot.cartId,
        userId: cartSnapshot.userId,
        totalQuantity,
        totalItemCount,
        subtotal,
        isReady: true,
      },
      items: itemResults.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        productImage: r.productImage,
        unitPrice: r.unitPrice,
        quantity: r.quantity,
        availableStock: r.availableStock,
        subtotal: r.subtotal,
        status: r.status,
        reason: r.reason,
      })),
      validation: {
        passed: true,
        failedItems: [],
      },
    }
  },

  async completeCheckout(input: CompleteCheckoutInput): Promise<CompleteCheckoutResult> {
    const { userId, selectedShippingId, selectedPaymentId } = input

    const preview = await this.initiateCheckout({ userId })
    CheckoutRules.assertPreviewValidForCompletion(preview)
    CheckoutRules.assertCartExists(preview.summary.cartId)

    const shippingOption = getShippingOption(selectedShippingId)
    const paymentMethod = getPaymentMethod(selectedPaymentId)
    const shippingFee = shippingOption?.price ?? 0
    const adminFee = paymentMethod?.fee ?? 0

    // Synchronous Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await OrderService.createDraftTx(tx, {
        checkoutPreview: preview,
        shippingFee,
        adminFee,
      })

      for (const item of preview.items) {
        await InventoryService.reserveStockTx(tx, {
          productId: item.productId,
          quantity: item.quantity,
        })
      }

      const cartCleared = await CartService.clearCartTx(tx, {
        userId,
        cartId: preview.summary.cartId!,
      })

      // Synchronous Audit Entry
      await tx.audit.create({
        data: {
          action: "ORDER_CONFIRMED",
          entityType: "Order",
          entityId: order.id,
          data: JSON.stringify({
            userId,
            totalAmount: order.subtotal,
            itemCount: order.totalItemCount,
          }),
        },
      })

      return {
        order,
        cartCleared,
      }
    })

    return {
      orderId: result.order.id,
      status: result.order.status as "DRAFT",
      totalQuantity: result.order.totalQuantity,
      totalItemCount: result.order.totalItemCount,
      subtotal: result.order.subtotal,
      shippingFee,
      adminFee,
      total: result.order.total,
      createdAt: result.order.createdAt,
    }
  },
} as const
