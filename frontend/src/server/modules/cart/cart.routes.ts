// ============================================================
// CART ROUTES
// Phase 4 Step 2: Add To Cart
// Phase 4 Step 3: Cart Management (Get, Update, Remove, Clear)
//
// Routes for Cart operations
// ============================================================
// PHASE 4 - Step 3: Cart Management
// ============================================================

import { Router } from "express"
import { CartController } from "./controller/cart.controller"
import { authenticate } from "../auth/auth.middleware"

const router = Router()

// ============================================================
// CART ENDPOINTS
// ============================================================

// ----- Step 2: Add To Cart -----

/**
 * POST /cart/items
 *
 * Add product to authenticated user's cart
 *
 * Request Body:
 * {
 *   "productId": number,
 *   "quantity"?: number  // default 1
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "cartId": number,
 *     "itemCount": number,
 *     "totalQuantity": number,
 *     "items": CartItem[]
 *   },
 *   "message": "Item added to cart"
 * }
 *
 * Errors:
 * - 401 Unauthorized: User not authenticated
 * - 400 Bad Request: Invalid input
 * - 404 Not Found: Product not found
 */
router.post(
  "/items",
  authenticate,
  CartController.addToCart
)

// ----- Step 3: Cart Management -----

/**
 * GET /cart
 *
 * Get authenticated user's cart
 *
 * Always returns a valid CartView, even if cart doesn't exist.
 * Empty cart is a valid business state (not an error).
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "cartId": number | null,
 *     "userId": number,
 *     "items": CartItem[],
 *     "itemCount": number,
 *     "totalQuantity": number,
 *     "createdAt": string | null,
 *     "updatedAt": string | null
 *   }
 * }
 *
 * Errors:
 * - 401 Unauthorized: User not authenticated
 */
router.get(
  "/",
  authenticate,
  CartController.getCart
)

/**
 * PATCH /cart/items/:productId
 *
 * Update cart item quantity (absolute value, not increment)
 *
 * Request Body:
 * {
 *   "quantity": number  // Must be 1 to MAX_CART_ITEM_QUANTITY
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "cartId": number,
 *     "previousQuantity": number,
 *     "newQuantity": number,
 *     "itemCount": number,
 *     "totalQuantity": number,
 *     "items": CartItem[]
 *   },
 *   "message": "Quantity updated"
 * }
 *
 * Errors:
 * - 401 Unauthorized: User not authenticated
 * - 400 Bad Request: Invalid quantity
 * - 404 Not Found: Cart or item not found
 */
router.patch(
  "/items/:productId",
  authenticate,
  CartController.updateQuantity
)

/**
 * DELETE /cart/items/:productId
 *
 * Remove item from cart
 * Note: Cart persists even if empty
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "cartId": number,
 *     "removedProductId": number,
 *     "itemCount": number,
 *     "totalQuantity": number,
 *     "items": CartItem[]
 *   },
 *   "message": "Item removed from cart"
 * }
 *
 * Errors:
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Cart or item not found
 */
router.delete(
  "/items/:productId",
  authenticate,
  CartController.removeItem
)

/**
 * DELETE /cart
 *
 * Clear all items from cart
 * Note: Cart persists with empty items
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "cartId": number,
 *     "itemsRemoved": number,
 *     "itemCount": number,
 *     "totalQuantity": number,
 *     "items": CartItem[]
 *   },
 *   "message": "Cart cleared"
 * }
 *
 * Errors:
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Cart not found
 */
router.delete(
  "/",
  authenticate,
  CartController.clearCart
)

export default router
