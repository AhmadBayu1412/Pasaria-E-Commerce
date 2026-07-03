// ============================================================
// CART CONTROLLER - HTTP Handlers
// Phase 4 Step 2: Add To Cart
//
// Handles HTTP requests for Cart operations
// ============================================================

import { Request, Response, NextFunction } from "express"
import { CartService } from "../services/cart.service.js"
import { addToCartSchema } from "../validation/cart.validation.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"
import { BusinessError } from "../../../shared/errors/business.error.js"

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

// ----- Error Code to HTTP Status Mapping -----
const ERROR_STATUS_MAP: Record<string, number> = {
  PRODUCT_NOT_FOUND: 404,
  CART_NOT_FOUND: 404,
  CART_ITEM_NOT_FOUND: 404,
  QUANTITY_EXCEEDS_LIMIT: 400,
  INVALID_QUANTITY: 400,
  DUPLICATE_PRODUCT: 409,
  UNAUTHORIZED: 401,
}

// ----- Controller Implementation -----

export const CartController = {
  /**
   * POST /cart/items
   *
   * Add product to authenticated user's cart
   *
   * Flow:
   * 1. Check authentication
   * 2. Validate request body
   * 3. Call CartService.addToCart
   * 4. Return updated cart state
   *
   * Response: 200 OK (not 201 - because sometimes it's increment, not create)
   */
  async addToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Step 1: Authentication check
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

      // Step 2: Validate request body
      const parseResult = addToCartSchema.safeParse(req.body)
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parseResult.error.issues[0].message,
          },
        })
        return
      }

      // Step 3: Execute domain behavior
      const result = await CartService.addToCart({
        userId: user.id,
        productId: parseResult.data.productId,
        quantity: parseResult.data.quantity,
      })

      // Step 4: Return response (200 OK - see note in header)
      res.status(200).json({
        success: true,
        data: {
          cartId: result.cart.id,
          itemCount: result.itemCount,
          totalQuantity: result.totalQuantity,
          items: result.cart.items,
        },
        message: "Item added to cart",
      })
    } catch (error) {
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
      next(error)
    }
  },
} as const
