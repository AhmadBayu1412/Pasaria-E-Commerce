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

  // ============================================================
  // ADDITIONAL ORDER ENDPOINTS (from PEIA audit)
  // ============================================================

  /**
   * GET /orders
   *
   * Get all orders for the authenticated user
   * Supports pagination
   */
  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      // Pagination params
      const page = parseInt(req.query.page as string, 10) || 1
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 100)
      const skip = (page - 1) * limit

      // Get orders from service
      const { OrderService } = await import("./order.service.js")
      const allOrders = await OrderService.getOrdersByUser(user.id)

      // Apply pagination
      const paginatedOrders = allOrders.slice(skip, skip + limit)

      res.status(200).json({
        success: true,
        data: {
          items: paginatedOrders,
          pagination: {
            page,
            limit,
            totalItems: allOrders.length,
            totalPages: Math.ceil(allOrders.length / limit),
          },
        },
      })
    } catch (error) {
      OrderController.handleError(error, res)
    }
  },

  /**
   * GET /orders/:id
   *
   * Get a specific order by ID
   * Only accessible by the order owner or admin
   */
  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      // Parse order ID
      const orderIdStr = req.params.id
      const orderId = parseInt(Array.isArray(orderIdStr) ? orderIdStr[0] : orderIdStr, 10)
      if (isNaN(orderId) || orderId <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid order ID",
          },
        })
        return
      }

      // Get order from service
      const { OrderService } = await import("./order.service.js")
      const order = await OrderService.getOrder(orderId)

      if (!order) {
        res.status(404).json({
          success: false,
          error: {
            code: "ORDER_NOT_FOUND",
            message: "Order not found",
          },
        })
        return
      }

      // Check ownership (unless admin)
      if (order.userId !== user.id && user.role !== "ADMIN") {
        res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to view this order",
          },
        })
        return
      }

      res.status(200).json({
        success: true,
        data: { order },
      })
    } catch (error) {
      OrderController.handleError(error, res)
    }
  },
} as const
