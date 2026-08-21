// ============================================================
// CHECKOUT ROUTES
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 7: Complete Checkout Endpoint
//
// Routes for Checkout operations
// ============================================================

import { Router } from "express"
import { CheckoutController } from "./checkout.controller"
import { authenticate } from "../auth/auth.middleware"

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

// ============================================================
// STEP 7: COMPLETE CHECKOUT
// ============================================================

/**
 * POST /checkout/complete
 *
 * Complete checkout with atomic transaction
 * Requires authentication
 *
 * Flow:
 * 1. Authenticate user
 * 2. Validate cart and inventory
 * 3. Execute atomic transaction:
 *    - Create order
 *    - Reserve inventory
 *    - Clear cart
 * 4. Return order confirmation
 *
 * Request: No body (data from authenticated user)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "orderId": number,
 *     "status": "DRAFT",
 *     "totalQuantity": number,
 *     "totalItemCount": number,
 *     "subtotal": number,
 *     "createdAt": string
 *   }
 * }
 *
 * Errors:
 * - 401 Unauthorized: User not authenticated
 * - 400 Bad Request: Cart empty, items unavailable, or insufficient stock
 * - 404 Not Found: Cart not found
 */
router.post(
  "/complete",
  authenticate,
  CheckoutController.completeCheckout
)

export default router
