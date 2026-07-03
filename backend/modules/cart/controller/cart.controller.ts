// ============================================================
// CART CONTROLLER - HTTP Handlers
// Phase 4 Step 2: Add To Cart
// Phase 4 Step 3: Cart Management (Get, Update, Remove, Clear)
//
// Handles HTTP requests for Cart operations
// ============================================================
// PHASE 4 - Step 3: Cart Management
// ============================================================

import { Request, Response, NextFunction } from "express"
import { CartService } from "../services/cart.service.js"
import {
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema
} from "../validation/cart.validation.js"
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
  INVALID_QUANTITY_ZERO: 400,  // Step 3: quantity cannot be zero
  DUPLICATE_PRODUCT: 409,
  UNAUTHORIZED: 401,
}

// ----- Controller Implementation -----

export const CartController = {
  // ============================================================
  // STEP 2: ADD TO CART
  // ============================================================

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
      CartController.handleError(error, res)
    }
  },

  // ============================================================
  // STEP 3: CART MANAGEMENT
  // ============================================================

  /**
   * GET /cart
   *
   * Get authenticated user's cart
   *
   * Returns unified CartView regardless of whether cart exists.
   * Empty cart is a valid business state (not an error).
   *
   * Response: 200 OK with CartView
   */
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Step 2: Get cart (always returns valid CartView)
      const cartView = await CartService.getCart({
        userId: user.id,
      })

      // Step 3: Return response
      res.status(200).json({
        success: true,
        data: cartView,
      })
    } catch (error) {
      CartController.handleError(error, res)
    }
  },

  /**
   * PATCH /cart/items/:productId
   *
   * Update cart item quantity
   * REPLACES quantity with absolute value (not increment)
   *
   * Request Body:
   * {
   *   "quantity": number  // Must be 1 to MAX_CART_ITEM_QUANTITY
   * }
   *
   * Response: 200 OK with updated cart
   * Errors:
   * - 400 Bad Request: Invalid quantity
   * - 404 Not Found: Cart or item not found
   */
  async updateQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Step 2: Parse productId from params
      const productIdStr = req.params.productId
      const productId = parseInt(Array.isArray(productIdStr) ? productIdStr[0] : productIdStr, 10)
      if (isNaN(productId) || productId <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid product ID",
          },
        })
        return
      }

      // Step 3: Validate request body
      const parseResult = updateCartItemSchema.safeParse(req.body)
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

      // Step 4: Execute domain behavior
      const result = await CartService.updateQuantity({
        userId: user.id,
        productId,
        quantity: parseResult.data.quantity,
      })

      // Step 5: Return response
      res.status(200).json({
        success: true,
        data: {
          cartId: result.cart.id,
          previousQuantity: result.previousQuantity,
          newQuantity: result.newQuantity,
          itemCount: result.itemCount,
          totalQuantity: result.totalQuantity,
          items: result.cart.items,
        },
        message: "Quantity updated",
      })
    } catch (error) {
      CartController.handleError(error, res)
    }
  },

  /**
   * DELETE /cart/items/:productId
   *
   * Remove item from cart
   * Note: Cart persists even if empty (valid business state)
   *
   * Response: 200 OK with updated cart
   * Errors:
   * - 404 Not Found: Cart or item not found
   */
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Step 2: Parse productId from params
      const productIdStr = req.params.productId
      const productId = parseInt(Array.isArray(productIdStr) ? productIdStr[0] : productIdStr, 10)
      if (isNaN(productId) || productId <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid product ID",
          },
        })
        return
      }

      // Step 3: Execute domain behavior
      const result = await CartService.removeItem({
        userId: user.id,
        productId,
      })

      // Step 4: Return response
      res.status(200).json({
        success: true,
        data: {
          cartId: result.cart.id,
          removedProductId: result.removedProductId,
          itemCount: result.itemCount,
          totalQuantity: result.totalQuantity,
          items: result.cart.items,
        },
        message: "Item removed from cart",
      })
    } catch (error) {
      CartController.handleError(error, res)
    }
  },

  /**
   * DELETE /cart
   *
   * Clear all items from cart
   * Note: Cart persists with empty items (valid business state)
   *
   * Response: 200 OK with empty cart
   * Errors:
   * - 404 Not Found: Cart not found
   */
  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Step 2: Execute domain behavior
      const result = await CartService.clearCart({
        userId: user.id,
      })

      // Step 3: Return response
      res.status(200).json({
        success: true,
        data: {
          cartId: result.cart.id,
          itemsRemoved: result.itemsRemoved,
          itemCount: result.cart.items.length,
          totalQuantity: result.cart.items.reduce((sum, item) => sum + item.quantity, 0),
          items: result.cart.items,
        },
        message: "Cart cleared",
      })
    } catch (error) {
      CartController.handleError(error, res)
    }
  },

  // ----- Error Handler -----

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
