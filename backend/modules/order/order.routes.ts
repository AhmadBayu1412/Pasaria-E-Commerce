// ============================================================
// ORDER ROUTES
// Phase 4 Step 6: Order Draft Foundation
// PEIA Audit: Added GET /orders and GET /orders/:id
// ============================================================

import { Router } from "express"
import { OrderController } from "./order.controller.js"
import { authenticate } from "../auth/auth.middleware.js"

const router = Router()

// ============================================================
// ORDER ENDPOINTS
// ============================================================

/**
 * GET /orders
 *
 * Get all orders for authenticated user (paginated)
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "items": Order[],
 *     "pagination": { page, limit, totalItems, totalPages }
 *   }
 * }
 */
router.get(
  "/",
  authenticate,
  OrderController.getOrders
)

/**
 * GET /orders/:id
 *
 * Get specific order by ID
 * Only accessible by order owner or admin
 *
 * Response:
 * {
 *   "success": true,
 *   "data": { "order": Order }
 * }
 *
 * Errors:
 * - 401 Unauthorized
 * - 403 Forbidden (not owner)
 * - 404 Not Found
 */
router.get(
  "/:id",
  authenticate,
  OrderController.getOrderById
)

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
 *     "status": "PROCESSING",
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

/**
 * PATCH /orders/:id/status
 *
 * Update order status (Next Proses)
 * Requires authentication
 *
 * Request Body:
 * {
 *   "status": "PROCESSING" | "SHIPPING" | "DELIVERED" | "COMPLETED"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": { "order": Order }
 * }
 *
 * Errors:
 * - 401 Unauthorized
 * - 403 Forbidden (not owner)
 * - 404 Not Found
 * - 400 Invalid state transition
 */
router.patch(
  "/:id/status",
  authenticate,
  OrderController.updateStatus
)

/**
 * POST /orders/:id/cancel
 *
 * Cancel/Return order
 * Requires authentication
 *
 * Request Body:
 * {
 *   "reason": string (optional - reason for cancellation)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": { "order": Order }
 * }
 *
 * Errors:
 * - 401 Unauthorized
 * - 403 Forbidden (not owner)
 * - 404 Not Found
 * - 400 Invalid state transition
 */
router.post(
  "/:id/cancel",
  authenticate,
  OrderController.cancelOrder
)

export default router
