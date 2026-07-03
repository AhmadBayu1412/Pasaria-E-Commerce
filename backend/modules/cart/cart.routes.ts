// ============================================================
// CART ROUTES
// Phase 4 Step 2: Add To Cart
//
// Routes for Cart operations
// ============================================================

import { Router } from "express"
import { CartController } from "./controller/cart.controller.js"
import { authenticate } from "../auth/auth.middleware.js"

const router = Router()

// ============================================================
// CART ENDPOINTS
// ============================================================

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

// ============================================================
// NOTE: Future endpoints (Step 3+)
// ============================================================
// GET  /cart           - Get user's cart
// PATCH /cart/items/:id - Update item quantity
// DELETE /cart/items/:id - Remove item from cart
// DELETE /cart          - Clear cart

export default router
