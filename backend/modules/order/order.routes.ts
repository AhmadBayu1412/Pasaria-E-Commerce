// ============================================================
// ORDER ROUTES
// Phase 4 Step 6: Order Draft Foundation
// ============================================================

import { Router } from "express"
import { OrderController } from "./order.controller.js"
import { authenticate } from "../auth/auth.middleware.js"

const router = Router()

// ============================================================
// ORDER ENDPOINTS
// ============================================================

/**
 * POST /orders/draft
 *
 * Create Order Draft from Checkout Preview
 * Requires authentication
 *
 * Flow:
 * 1. Authenticate user
 * 2. Get checkout preview (Cart + Inventory + Product validation)
 * 3. Create Order Draft
 * 4. Return Order Draft
 *
 * Request: No body (cart from authenticated user)
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
 *     "items": [...],
 *     "createdAt": string
 *   }
 * }
 *
 * Errors:
 * - 401 Unauthorized
 * - 400 Cart Empty / Checkout Invalid / Order Empty
 * - 404 Product Not Found
 */
router.post(
  "/draft",
  authenticate,
  OrderController.createDraft
)

export default router
