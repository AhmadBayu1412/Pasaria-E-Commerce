// ============================================================
// ORDER CONTROLLER — HTTP Handlers
// Phase 4 Step 6: Order Draft Foundation
// ============================================================

import { Request, Response, NextFunction } from "express"
import { OrderService } from "./order.service.js"
import { CheckoutService } from "../checkout/checkout.service.js"
import type { AuthenticatedUser } from "../../shared/session/session.types.js"
import { BusinessError } from "../../shared/errors/business.error.js"

// ----- Error Code to HTTP Status Mapping -----
const ERROR_STATUS_MAP: Record<string, number> = {
  CART_EMPTY: 400,
  CHECKOUT_NOT_VALID: 400,
  CHECKOUT_UNAVAILABLE_ITEMS: 400,
  ORDER_EMPTY: 400,
  PRODUCT_NOT_FOUND: 404,
  UNAUTHORIZED: 401,
}

// ----- Controller Implementation -----
export const OrderController = {
  /**
   * POST /orders/draft
   *
   * Create Order Draft from Checkout Preview
   * 
   * Flow:
   * 1. Authenticate user
   * 2. Get checkout preview (validates cart + inventory)
   * 3. Create order draft
   * 4. Return order draft
   *
   * Response: 200 OK with OrderDraft
   */
  async createDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // STEP 1: Authentication check
      const user = req.user as AuthenticatedUser | undefined
      if (!user?.id) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        })
        return
      }

      // STEP 2: Get checkout preview first
      // This validates cart and inventory
      const checkoutPreview = await CheckoutService.initiateCheckout({
        userId: user.id,
      })

      // STEP 3: Create order draft from preview
      const orderDraft = await OrderService.createDraft({
        checkoutPreview,
      })

      // STEP 4: Return response
      res.status(200).json({
        success: true,
        data: {
          orderId: orderDraft.id,
          status: orderDraft.status,
          totalQuantity: orderDraft.totalQuantity,
          totalItemCount: orderDraft.totalItemCount,
          subtotal: orderDraft.subtotal,
          items: orderDraft.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
          createdAt: orderDraft.createdAt.toISOString(),
        },
      })
    } catch (error) {
      OrderController.handleError(error, res)
    }
  },

  /**
   * Handle BusinessError and other errors
   */
  handleError(error: unknown, res: Response): void {
    if (error instanceof BusinessError) {
      const status = ERROR_STATUS_MAP[error.code ?? ""] ?? 400
      res.status(status).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      })
      return
    }
    // Re-throw non-BusinessError for global error handler
    throw error
  },
} as const
