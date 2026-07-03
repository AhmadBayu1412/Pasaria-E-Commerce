// ============================================================
// CHECKOUT ROUTES
// Phase 4 Step 5: Checkout Orchestration Foundation
//
// Routes for Checkout operations
// ============================================================

import { Router } from "express"
import { CheckoutController } from "./checkout.controller.js"
import { authenticate } from "../auth/auth.middleware.js"

const router = Router()

// ============================================================
// CHECKOUT ENDPOINTS
// ============================================================

/**
 * POST /checkout
 *
 * Initiate checkout process
 * Requires authentication
 *
 * Flow:
 * 1. Authenticate user
 * 2. Get user's cart
 * 3. Validate all items against inventory
 * 4. Return checkout preview
 *
 * Request: No body (cart from authenticated user)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "summary": {
 *       "cartId": number,
 *       "userId": number,
 *       "totalQuantity": number,
 *       "isReady": boolean
 *     },
 *     "items": [...],
 *     "validation": {
 *       "passed": boolean,
 *       "failedItems": []
 *     }
 *   }
 * }
 *
 * Errors:
 * - 401 Unauthorized: User not authenticated
 * - 400 Bad Request: Cart empty or items unavailable
 * - 404 Not Found: Product not found
 */
router.post(
  "/",
  authenticate,
  CheckoutController.initiateCheckout
)

export default router
