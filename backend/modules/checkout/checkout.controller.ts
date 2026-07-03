// ============================================================
// CHECKOUT CONTROLLER — HTTP Handlers
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 7: Complete Checkout Endpoint
//
// Handles HTTP requests for Checkout operations
// ============================================================

import { Request, Response, NextFunction } from "express"
import { CheckoutService } from "./checkout.service.js"
import type { AuthenticatedUser } from "../../shared/session/session.types.js"
import { BusinessError } from "../../shared/errors/business.error.js"

// ----- Error Code to HTTP Status Mapping -----
const ERROR_STATUS_MAP: Record<string, number> = {
  CART_EMPTY: 400,
  CHECKOUT_NOT_VALID: 400,
  CHECKOUT_UNAVAILABLE_ITEMS: 400,
  INSUFFICIENT_STOCK: 400,
  CART_NOT_FOUND: 404,
  PRODUCT_NOT_FOUND: 404,
  UNAUTHORIZED: 401,
}

// ----- Controller Implementation -----
export const CheckoutController = {
  /**
   * POST /checkout
   *
   * Initiate checkout process
   * Returns checkout preview
   *
   * Flow:
   * 1. Check authentication
   * 2. Call CheckoutService.initiateCheckout
   * 3. Return preview response
   *
   * Response: 200 OK with CheckoutPreview
   * Errors:
   * - 400 Bad Request: Cart empty / items unavailable
   * - 401 Unauthorized: User not authenticated
   * - 404 Not Found: Product not found
   */
  async initiateCheckout(req: Request, res: Response, _next: NextFunction): Promise<void> {
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

      // STEP 2: Execute checkout orchestration
      const preview = await CheckoutService.initiateCheckout({
        userId: user.id,
      })

      // STEP 3: Return response
      res.status(200).json({
        success: true,
        data: preview,
      })
    } catch (error) {
      CheckoutController.handleError(error, res)
    }
  },

  // ============================================================
  // STEP 7: COMPLETE CHECKOUT
  // ============================================================

  /**
   * POST /checkout/complete
   *
   * Complete checkout process with atomic transaction
   * Creates order, reserves inventory, and clears cart in one transaction
   *
   * Flow:
   * 1. Check authentication
   * 2. Call CheckoutService.completeCheckout
   * 3. Return order confirmation
   *
   * Response: 200 OK with CompleteCheckoutResult
   * Errors:
   * - 400 Bad Request: Cart empty / items unavailable / insufficient stock
   * - 401 Unauthorized: User not authenticated
   * - 404 Not Found: Cart not found
   */
  async completeCheckout(req: Request, res: Response, _next: NextFunction): Promise<void> {
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

      // STEP 2: Execute complete checkout with transaction
      const result = await CheckoutService.completeCheckout({
        userId: user.id,
      })

      // STEP 3: Return response
      res.status(200).json({
        success: true,
        data: {
          orderId: result.orderId,
          status: result.status,
          totalQuantity: result.totalQuantity,
          totalItemCount: result.totalItemCount,
          subtotal: result.subtotal,
          createdAt: result.createdAt.toISOString(),
        },
      })
    } catch (error) {
      CheckoutController.handleError(error, res)
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
