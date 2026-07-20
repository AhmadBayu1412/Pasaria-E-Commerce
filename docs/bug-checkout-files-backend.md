# BACKEND FILES

---

## `backend/modules/checkout/checkout.service.ts`

```typescript
// ============================================================
// CHECKOUT SERVICE — Application Orchestrator
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 6: Include Product Query for Snapshot
// Phase 4 Step 7: Complete Checkout with Transaction
// Phase 4 Step 8: Background Jobs Integration
//
// Philosophy:
// - Application Service, NOT Domain Service
// - ONLY orchestrates, no business rules
// - Uses domain contracts, not internal entities
// - Let domains compute their own fields
// - SOLE TRANSACTION OWNER (Step 7)
// - POST-COMMIT QUEUE ENQUEUE (Step 8)
// ============================================================

import { prisma } from "../../infra/db/prisma.js"
import { CartService } from "../cart/services/cart.service.js"
import { InventoryService } from "../inventory/inventory.service.js"
import { getProductForSnapshot } from "../product/services/product.service.js"
import { CheckoutRules } from "./checkout.rules.js"
import { OrderService } from "../order/order.service.js"
import { BusinessError } from "../../shared/errors/business.error.js"
import { CheckoutQueueProducer } from "../../infra/queue/checkout.producer.js"
import type {
  InitiateCheckoutInput,
  CheckoutPreview,
  CompleteCheckoutInput,
  CompleteCheckoutResult,
} from "./checkout.types.js"

// ----- Shipping Options (mirrored from shipping.controller.ts) -----
const SHIPPING_OPTIONS: Array<{ id: string; name: string; price: number }> = [
  { id: "jne_reg", name: "JNE Regular", price: 15000 },
  { id: "jne_yes", name: "JNE YES", price: 35000 },
  { id: "pos_kilat", name: "Pos Kilat", price: 20000 },
  { id: "tiki_reg", name: "TIKI Regular", price: 18000 },
  { id: "grab_express", name: "GrabExpress", price: 25000 },
]

// ----- Payment Methods (mirrored from payment-methods.controller.ts) -----
const PAYMENT_METHODS: Array<{ id: string; name: string; fee: number }> = [
  { id: "bca_va", name: "BCA Virtual Account", fee: 4000 },
  { id: "mandiri_va", name: "Mandiri Virtual Account", fee: 4000 },
  { id: "bni_va", name: "BNI Virtual Account", fee: 4000 },
  { id: "bri_va", name: "BRI Virtual Account", fee: 4000 },
  { id: "gopay", name: "GoPay", fee: 2000 },
  { id: "ovo", name: "OVO", fee: 2000 },
  { id: "dana", name: "DANA", fee: 2000 },
  { id: "credit_card", name: "Kartu Kredit", fee: 2.9 }, // percentage-based
  { id: "indomaret", name: "Indomaret", fee: 2500 },
  { id: "alfamart", name: "Alfamart", fee: 2500 },
  { id: "qris", name: "QRIS", fee: 0 },
]

/**
 * Get shipping option by ID
 */
function getShippingOption(shippingId?: string) {
  if (!shippingId) return null
  return SHIPPING_OPTIONS.find((s) => s.id === shippingId) || null
}

/**
 * Get payment method by ID
 */
function getPaymentMethod(paymentId?: string) {
  if (!paymentId) return null
  return PAYMENT_METHODS.find((p) => p.id === paymentId) || null
}

export const CheckoutService = {
  /**
   * Initiate Checkout — Application Orchestrator
   *
   * Phase 6: Now collects complete snapshot data including Product info
   *
   * Workflow:
   * 1. Get cart snapshot through contract (Cart owns this data)
   * 2. Validate pre-condition (CheckoutRules)
   * 3. Validate each item AND get product info (parallel)
   * 4. Aggregate results
   * 5. Calculate totals
   * 6. If any item unavailable, throw
   * 7. Build structured preview
   *
   * @throws BusinessError CART_EMPTY - Cart has no items
   * @throws BusinessError CHECKOUT_UNAVAILABLE_ITEMS - One or more items unavailable
   */
  async initiateCheckout(input: InitiateCheckoutInput): Promise<CheckoutPreview> {
    const { userId } = input

    // STEP 1: Get cart snapshot through contract
    const cartSnapshot = await CartService.getCartSnapshot(userId)

    // STEP 2: Validate pre-condition
    CheckoutRules.assertCartNotEmpty(cartSnapshot.totalQuantity)

    // STEP 3: Validate each item AND get product info in parallel
    const itemResults = await Promise.all(
      cartSnapshot.items.map(async (item) => {
        // Validate stock
        const stockResult = await InventoryService.validateCartItemForCheckout({
          productId: item.productId,
          quantity: item.quantity,
        })

        // Get product info for snapshot (NEW in Step 6)
        const product = await getProductForSnapshot(item.productId)

        // Convert Decimal to number for API
        const unitPriceNum = Number(product.basePrice)
        const subtotalNum = unitPriceNum * item.quantity

        return {
          productId: item.productId,
          productName: product.name,
          productImage: product.imageUrl,
          unitPrice: unitPriceNum,
          quantity: item.quantity,
          availableStock: stockResult.availableStock,
          subtotal: subtotalNum,
          status: stockResult.status,
          reason: stockResult.reason,
        }
      })
    )

    // STEP 4: Aggregate results
    const failedItems = itemResults
      .filter((r) => r.status === "INVALID")
      .map((r) => r.productId)

    const passed = failedItems.length === 0

    // STEP 5: Calculate totals (use number for simplicity)
    const totalQuantity = itemResults.reduce((sum, i) => sum + i.quantity, 0)
    const totalItemCount = itemResults.length
    const subtotal = itemResults.reduce((sum, i) => sum + Number(i.subtotal), 0)

    // STEP 6: If ANY item unavailable, throw (no partial checkout)
    if (!passed) {
      throw new BusinessError(
        `Some items are unavailable: ${failedItems.join(", ")}`,
        400,
        "CHECKOUT_UNAVAILABLE_ITEMS"
      )
    }

    // STEP 7: Build structured preview
    return {
      summary: {
        cartId: cartSnapshot.cartId,
        userId: cartSnapshot.userId,
        totalQuantity,
        totalItemCount,
        subtotal,
        isReady: true,
      },
      items: itemResults.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        productImage: r.productImage,
        unitPrice: r.unitPrice,
        quantity: r.quantity,
        availableStock: r.availableStock,
        subtotal: r.subtotal,
        status: r.status,
        reason: r.reason,
      })),
      validation: {
        passed: true,
        failedItems: [],
      },
    }
  },

  // ============================================================
  // STEP 7: COMPLETE CHECKOUT — SOLE TRANSACTION ORCHESTRATOR
  // STEP 8: POST-COMMIT QUEUE ENQUEUE
  // ============================================================

  /**
   * Complete Checkout — Sole Transaction Orchestrator
   *
   * This is the ONLY place where cross-domain transaction is opened.
   * All other services just receive the transaction client.
   *
   * After commit, jobs are enqueued to BullMQ for:
   * - Order confirmation email
   * - Audit log creation
   *
   * Responsibilities:
   * 1. Get checkout preview (validates cart + inventory)
   * 2. Open transaction
   * 3. Coordinate Order + Inventory + Cart
   * 4. Handle commit/rollback
   * 5. Enqueue post-commit jobs (Step 8) - FIRE AND FORGET
   *
   * @param input - CompleteCheckoutInput with userId
   * @returns CompleteCheckoutResult
   *
   * @throws BusinessError CART_EMPTY
   * @throws BusinessError CHECKOUT_NOT_VALID
   * @throws BusinessError CHECKOUT_UNAVAILABLE_ITEMS
   * @throws BusinessError INSUFFICIENT_STOCK
   * @throws BusinessError CART_NOT_FOUND
   */
  async completeCheckout(input: CompleteCheckoutInput): Promise<CompleteCheckoutResult> {
    const { userId, selectedShippingId, selectedPaymentId } = input

    // STEP 1: Get checkout preview (validates cart + inventory)
    const preview = await this.initiateCheckout({ userId })

    // STEP 2: Validate for completion
    CheckoutRules.assertPreviewValidForCompletion(preview)
    CheckoutRules.assertCartExists(preview.summary.cartId)

    // STEP 3: Get shipping and payment fees
    const shippingOption = getShippingOption(selectedShippingId)
    const paymentMethod = getPaymentMethod(selectedPaymentId)
    const shippingFee = shippingOption?.price ?? 0
    const adminFee = paymentMethod?.fee ?? 0

    // Record transaction start time for audit
    const transactionStartTime = Date.now()

    // STEP 4: Execute in transaction
    // NOTE: This is the ONLY place where prisma.$transaction is called
    const result = await prisma.$transaction(async (tx) => {
      // 4a. Create order draft (uses tx) - pass shipping fee and admin fee
      const order = await OrderService.createDraftTx(tx, {
        checkoutPreview: preview,
        shippingFee,
        adminFee,
      })

      // 3b. Reserve inventory for each item (uses tx)
      // This validates stock and decrements availableStock atomically
      for (const item of preview.items) {
        await InventoryService.reserveStockTx(tx, {
          productId: item.productId,
          quantity: item.quantity,
        })
      }

      // 3c. Clear cart (uses tx)
      const cartCleared = await CartService.clearCartTx(tx, {
        userId,
        cartId: preview.summary.cartId!,
      })

      return {
        order,
        cartCleared,
      }
    })

    // ============================================================
    // STEP 8: POST-COMMIT OPERATIONS
    // These operations happen AFTER transaction commits
    // They are FIRE-AND-FORGET - checkout succeeds even if these fail
    // ============================================================

    // Get user email for email job
    // In production, this would come from user service
    const userEmail = `user-${userId}@example.com`

    // Enqueue order confirmation email (fire-and-forget)
    void CheckoutQueueProducer.enqueueOrderConfirmationEmail({
      orderId: result.order.id,
      userId,
      email: userEmail,
      template: "order_confirmation",
      data: {
        orderId: result.order.id,
        totalAmount: result.order.subtotal,
        itemCount: result.order.totalItemCount,
      },
    }).catch((err) => {
      console.error("[CHECKOUT] Failed to enqueue email job:", err)
    })

    // Enqueue audit log (fire-and-forget)
    void CheckoutQueueProducer.enqueueAuditLog({
      orderId: result.order.id,
      userId,
      action: "ORDER_CONFIRMED",
      metadata: {
        totalAmount: result.order.subtotal,
        itemCount: result.order.totalItemCount,
        transactionTimeMs: Date.now() - transactionStartTime,
      },
    }).catch((err) => {
      console.error("[CHECKOUT] Failed to enqueue audit job:", err)
    })

    // STEP 5: Return result
    // Note: Queue jobs are enqueued but not awaited
    // Checkout succeeds even if queue operations fail
    return {
      orderId: result.order.id,
      status: result.order.status as "DRAFT",
      totalQuantity: result.order.totalQuantity,
      totalItemCount: result.order.totalItemCount,
      subtotal: result.order.subtotal,
      shippingFee,
      adminFee,
      total: result.order.total,
      createdAt: result.order.createdAt,
    }
  },
} as const
```

---

## `backend/modules/checkout/checkout.controller.ts`

```typescript
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
   * 2. Extract selected shipping and payment from request body
   * 3. Call CheckoutService.completeCheckout
   * 4. Return order confirmation
   *
   * Request body:
   * - selectedShippingId: string (optional)
   * - selectedPaymentId: string (optional)
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

      // STEP 2: Extract selected shipping and payment from request body
      const { selectedShippingId, selectedPaymentId } = req.body

      // STEP 3: Execute complete checkout with transaction
      const result = await CheckoutService.completeCheckout({
        userId: user.id,
        selectedShippingId,
        selectedPaymentId,
      })

      // STEP 4: Return response with full financial breakdown
      res.status(200).json({
        success: true,
        data: {
          orderId: result.orderId,
          status: result.status,
          totalQuantity: result.totalQuantity,
          totalItemCount: result.totalItemCount,
          subtotal: result.subtotal,
          shippingFee: result.shippingFee,
          adminFee: result.adminFee,
          total: result.total,
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
```

---

## `backend/modules/checkout/checkout.routes.ts`

```typescript
// ============================================================
// CHECKOUT ROUTES
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 7: Complete Checkout Endpoint
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
```

---

## `backend/modules/checkout/checkout.types.ts`

```typescript
// ============================================================
// CHECKOUT DOMAIN TYPES
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 6: Expanded Preview with Product Snapshot
// Phase 4 Step 7: Complete Checkout Transaction
// Phase 5 Step 1: Added shipping & tax to CheckoutPreview
//
// Philosophy:
// - Application Service contract (not Domain Service)
// - Only orchestrates, no business rules
// - Uses domain contracts, not internal entities
// ============================================================

// ----- Input Types -----
export interface InitiateCheckoutInput {
  readonly userId: number;
}

/**
 * Input for complete checkout
 * Now includes shipping and payment selection
 */
export interface CompleteCheckoutInput {
  readonly userId: number;
  readonly selectedShippingId?: string;
  readonly selectedPaymentId?: string;
}

// ----- Shipping Info -----
export interface ShippingInfo {
  readonly recipientName: string;
  readonly phone: string;
  readonly address: string;
  readonly city: string;
  readonly postalCode: string;
  readonly fee: number;
}

// ----- Output: Checkout Preview (Nested Structure) -----
export interface CheckoutPreview {
  readonly summary: {
    readonly cartId: number | null;
    readonly userId: number;
    readonly totalQuantity: number;
    readonly totalItemCount: number;
    readonly subtotal: number;
    readonly isReady: boolean;
    // 💰 FINANCIAL FIELDS - Phase 5 Step 1
    readonly tax?: number;
  };

  readonly items: ReadonlyArray<CheckoutItemPreview>;

  readonly validation: {
    readonly passed: boolean;
    readonly failedItems: ReadonlyArray<number>;
  };

  // 📍 SHIPPING INFO - Phase 5 Step 1
  readonly shipping?: ShippingInfo;
}

export interface CheckoutItemPreview {
  readonly productId: number;
  readonly productName: string;
  readonly productImage?: string | null;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly availableStock: number;
  readonly subtotal: number;
  readonly status: "VALID" | "INVALID";
  readonly reason?: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK";
}

/**
 * Result of complete checkout
 * API-friendly - only data that makes sense for response
 */
export interface CompleteCheckoutResult {
  readonly orderId: number;
  readonly status: "DRAFT";
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
  readonly shippingFee: number;
  readonly adminFee: number;
  readonly total: number;
  readonly createdAt: Date;
}

/**
 * Reserved inventory item (internal use)
 */
export interface ReservedItem {
  readonly productId: number;
  readonly quantity: number;
  readonly reservedAt: Date;
}

/**
 * Internal result from complete checkout transaction
 */
export interface CompleteCheckoutInternalResult {
  readonly orderId: number;
  readonly status: "DRAFT";
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
  readonly createdAt: Date;
  readonly cartId: number | null;
  readonly itemsRemoved: number;
}
```

---

## `backend/modules/checkout/checkout.validation.ts`

```typescript
// ============================================================
// CHECKOUT VALIDATION (Zod Schemas)
// Phase 4 Step 5: Checkout Orchestration Foundation
//
// Note: POST /checkout has no request body in Step 5
// Authentication is handled by middleware (authenticate)
// Validation is minimal - just ensure request is well-formed
// ============================================================

import { z } from "zod"

// Step 5: No request body validation needed
// All data comes from authenticated user's cart

export const checkoutQuerySchema = z.object({})

export type CheckoutQueryInput = z.infer<typeof checkoutQuerySchema>

export const CheckoutValidationMessages = {
  UNAUTHORIZED: "Authentication required",
} as const
```

---

## `backend/modules/checkout/checkout.rules.ts`

```typescript
// ============================================================
// CHECKOUT RULES (Pure Validation Only)
// Phase 4 Step 5: Checkout Orchestration Foundation
// Phase 4 Step 7: Checkout Completion Rules
//
// Philosophy:
// - ONLY pre-condition checks
// - NO business rules (that's domain responsibility)
// - NO database access
// ============================================================

import { BusinessError } from "../../shared/errors/business.error.js"
import type { CheckoutPreview } from "./checkout.types.js"

export const CheckoutRules = {
  /**
   * V1: Cart must have at least one item
   *
   * This is the ONLY rule for Step 5.
   * All other validations (stock, product existence) are
   * handled by their respective domain services.
   */
  assertCartNotEmpty(totalQuantity: number): void {
    if (totalQuantity === 0) {
      throw new BusinessError(
        "Cart is empty",
        400,
        "CART_EMPTY"
      )
    }
  },

  // ============================================================
  // STEP 7: CHECKOUT COMPLETION RULES
  // ============================================================

  /**
   * V2: Checkout preview must be valid for completion
   */
  assertPreviewValidForCompletion(preview: CheckoutPreview): void {
    if (!preview.validation.passed) {
      throw new BusinessError(
        "Checkout preview is not valid. Some items are unavailable.",
        400,
        "CHECKOUT_NOT_VALID"
      )
    }
  },

  /**
   * V3: Cart must exist for checkout completion
   */
  assertCartExists(cartId: number | null): void {
    if (cartId === null) {
      throw new BusinessError(
        "Cart not found",
        404,
        "CART_NOT_FOUND"
      )
    }
  },
} as const
```

---

## `backend/modules/cart/services/cart.service.ts`

```typescript
// ============================================================
// CART SERVICE - Domain Behavior Implementation
// Phase 4 Step 2: Add To Cart
// Phase 4 Step 3: Cart Management (Get, Update, Remove, Clear)
// Phase 4 Step 7: Add clearCartTx() for atomic transactions
// Phase 4 Step 9: Add Cart Cache Optimization
//
// Responsible for:
// - Lazy Cart creation
// - Add item to Cart (create or increment)
// - Get Cart (returns unified CartView) - WITH cache
// - Update item quantity
// - Remove item from cart
// - Clear all items from cart
// - All CartItem modifications through this service
//
// NOT responsible for:
// - Inventory management (Step 4)
// - Checkout (Step 5+)
// - Pricing (Step 5+)
// - Cache operations (handled by adapter)
// ============================================================
// PHASE 4 - Step 9: Cart Optimization
// Cache Aside Pattern: Orchestration in CartService, operations in adapter
// ============================================================

import { prisma } from "../../../infra/db/prisma.js"
import { CartRules } from "../rules/cart.rules.js"
import { BusinessError } from "../../../shared/errors/business.error.js"
import type { Prisma } from "@prisma/client"
import type {
  AddToCartServiceInput,
  AddToCartResult,
  CartWithItems,
  GetCartServiceInput,
  GetCartResult,
  CartView,
  CartItemView,
  UpdateQuantityServiceInput,
  UpdateQuantityResult,
  RemoveItemServiceInput,
  RemoveItemResult,
  ClearCartServiceInput,
  ClearCartResult,
  ClearCartTxInput,
  ClearCartTxResult,
} from "../types/cart.types.js"
import { getCachedCart, setCachedCart, invalidateCartCache } from "./cart-cache.adapter.js"

// ----- Service Implementation -----

export const CartService = {
  /**
   * Add Product To Cart
   *
   * Algorithm:
   * 1. Assert product exists (Business Rule)
   * 2. Get or create Cart lazily (Data Access)
   * 3. Check if product already in cart (Data Access)
   * 4. If exists: increment quantity
   * 5. If not exists: create CartItem
   * 6. Return updated cart with computed fields
   *
   * Uses Prisma transaction for consistency.
   */
  async addToCart(input: AddToCartServiceInput): Promise<AddToCartResult> {
    const { userId, productId, quantity = 1 } = input

    // Step 1: Business validation - Product must exist
    await CartRules.assertProductExists(productId)

    // Step 2: Execute in transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // 2a: Get or create Cart (Lazy creation)
      let cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      })

      if (!cart) {
        cart = await tx.cart.create({
          data: { userId },
          include: { items: true },
        })
      }

      let action: "CREATED" | "INCREMENTED"

      // Use upsert to avoid race condition
      // If product exists in cart, increment; otherwise create new
      CartRules.assertQuantityWithinLimit(quantity)

      const upsertResult = await tx.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        create: {
          cartId: cart.id,
          productId,
          quantity,
        },
        update: {
          quantity: { increment: quantity },
        },
      })

      // Determine action based on whether it was created or updated
      // We can't directly know from upsert result, so check original count
      const wasCreated = upsertResult.quantity === quantity
      action = wasCreated ? "CREATED" : "INCREMENTED"

      // Step 3: Fetch updated cart with all items
      const updatedCart = await tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      return {
        cart: updatedCart as CartWithItems,
        action,
      }
    })

    // Step 4: Build response
    const response = buildCartResponse(result.cart, result.action)

    // Step 5: Invalidate cache (Step 9)
    invalidateCartCache(userId).catch(() => {})

    return response
  },

  // ============================================================
  // STEP 3: CART MANAGEMENT METHODS
  // ============================================================

  /**
   * Get Cart - Returns unified CartView
   *
   * WITH Cache Aside Pattern (Step 9):
   * 1. Try cache first
   * 2. If hit → return cached CartView
   * 3. If miss → query PostgreSQL, cache result
   * 4. Return CartView
   *
   * @param input - GetCartServiceInput with userId
   * @returns CartView (always valid shape)
   */
  async getCart(input: GetCartServiceInput): Promise<GetCartResult> {
    const { userId } = input

    // Step 1: Try cache first
    const cachedCart = await getCachedCart(userId)
    if (cachedCart) {
      return cachedCart
    }

    // Step 2: Cache miss - query PostgreSQL
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    })

    // Step 3: Build CartView
    const cartView: CartView = cart
      ? buildCartView(cart, cart.id)
      : buildEmptyCartView(userId)

    // Step 4: Cache the result (fire-and-forget)
    setCachedCart(userId, cartView).catch(() => {})

    // Step 5: Return
    return cartView
  },

  /**
   * Update Cart Item Quantity
   *
   * REPLACES the quantity, not increments it.
   * Uses absolute quantity value from request.
   */
  async updateQuantity(input: UpdateQuantityServiceInput): Promise<UpdateQuantityResult> {
    const { userId, productId, quantity } = input

    // Step 1: Business validation - Cart must exist
    await CartRules.assertCartExistsForUser(userId)

    // Step 2: Execute in transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // 2a: Get cart with item
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      })

      if (!cart) {
        throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
      }

      // 2b: Find the item
      const item = cart.items.find(i => i.productId === productId)
      if (!item) {
        throw new BusinessError("Cart item not found", 404, "CART_ITEM_NOT_FOUND")
      }

      const previousQuantity = item.quantity

      // 2c: Validate new quantity (I1 + I2 + I3)
      CartRules.assertValidUpdateQuantity(quantity)

      // 2d: Update quantity
      await tx.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      })

      // 2e: Fetch updated cart
      const updatedCart = await tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      return {
        cart: updatedCart as CartWithItems,
        previousQuantity,
        newQuantity: quantity,
      }
    })

    // Step 3: Build response
    const response = {
      cart: result.cart,
      previousQuantity: result.previousQuantity,
      newQuantity: result.newQuantity,
      itemCount: result.cart.items.length,
      totalQuantity: result.cart.items.reduce((sum, item) => sum + item.quantity, 0),
    }

    // Step 4: Invalidate cache (Step 9)
    invalidateCartCache(userId).catch(() => {})

    return response
  },

  /**
   * Remove Item from Cart
   */
  async removeItem(input: RemoveItemServiceInput): Promise<RemoveItemResult> {
    const { userId, productId } = input

    // Step 1: Business validation - Cart must exist
    await CartRules.assertCartExistsForUser(userId)

    // Step 2: Execute in transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // 2a: Get cart
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      })

      if (!cart) {
        throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
      }

      // 2b: Find the item
      const item = cart.items.find(i => i.productId === productId)
      if (!item) {
        throw new BusinessError("Cart item not found", 404, "CART_ITEM_NOT_FOUND")
      }

      // 2c: Delete item (NOT cart - cart persists)
      await tx.cartItem.delete({
        where: { id: item.id },
      })

      // 2d: Fetch updated cart
      const updatedCart = await tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      return {
        cart: updatedCart as CartWithItems,
        removedProductId: productId,
      }
    })

    // Step 3: Build response
    const response = {
      cart: result.cart,
      removedProductId: result.removedProductId,
      itemCount: result.cart.items.length,
      totalQuantity: result.cart.items.reduce((sum, item) => sum + item.quantity, 0),
    }

    // Step 4: Invalidate cache (Step 9)
    invalidateCartCache(userId).catch(() => {})

    return response
  },

  /**
   * Clear Cart - Remove all items
   */
  async clearCart(input: ClearCartServiceInput): Promise<ClearCartResult> {
    const { userId } = input

    // Step 1: Business validation - Cart must exist
    await CartRules.assertCartExistsForUser(userId)

    // Step 2: Execute in transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // 2a: Get cart
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      })

      if (!cart) {
        throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
      }

      const itemsRemoved = cart.items.length

      // 2b: Delete all items (NOT cart - cart persists)
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      // 2c: Fetch updated cart (empty)
      const updatedCart = await tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      return {
        cart: updatedCart as CartWithItems,
        itemsRemoved,
      }
    })

    // Step 3: Build response
    const response = {
      cart: result.cart,
      itemsRemoved: result.itemsRemoved,
    }

    // Step 4: Invalidate cache (Step 9)
    invalidateCartCache(userId).catch(() => {})

    return response
  },

  /**
   * Get Cart by User ID (Internal Use)
   * Returns null if cart doesn't exist (lazy - cart not created yet)
   */
  async getCartByUserId(userId: number): Promise<CartWithItems | null> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    })
    return cart as CartWithItems | null
  },

  // ============================================================
  // STEP 5: CART SNAPSHOT FOR APPLICATION SERVICE
  // ============================================================

  /**
   * Get Cart Snapshot — Application Service Use
   */
  async getCartSnapshot(userId: number): Promise<CartSnapshot> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    })

    if (!cart) {
      return {
        cartId: null,
        userId,
        items: [],
        totalQuantity: 0,
      }
    }

    return {
      cartId: cart.id,
      userId: cart.userId,
      items: cart.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      totalQuantity: cart.items.reduce((sum, i) => sum + i.quantity, 0),
    }
  },

  // ============================================================
  // STEP 7: CLEAR CART FOR TRANSACTION
  // ============================================================

  /**
   * Clear Cart — Inside Transaction
   */
  async clearCartTx(
    tx: Prisma.TransactionClient,
    input: ClearCartTxInput
  ): Promise<ClearCartTxResult> {
    const { userId, cartId } = input

    // Get cart to count items
    const cart = await tx.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    })

    if (!cart) {
      throw new BusinessError("Cart not found", 404, "CART_NOT_FOUND")
    }

    // Count items before deletion
    const itemsRemoved = cart.items.length

    // Delete all items (NOT cart - cart persists)
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    return {
      itemsRemoved,
      cartId: cart.id,
    }
  },
} as const

/**
 * Cart Snapshot Contract
 */
export interface CartSnapshot {
  readonly cartId: number | null;
  readonly userId: number;
  readonly items: ReadonlyArray<{
    readonly productId: number;
    readonly quantity: number;
  }>;
  readonly totalQuantity: number;
}

// ----- Helper Functions -----

function buildCartResponse(cart: CartWithItems, action: "CREATED" | "INCREMENTED"): AddToCartResult {
  return {
    cart,
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    _meta: {
      action,
    },
  }
}

function buildCartView(cart: CartWithItems, cartId: number): CartView {
  const items: CartItemView[] = cart.items.map(item => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }))

  return {
    cartId,
    userId: cart.userId,
    items,
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  }
}

function buildEmptyCartView(userId: number): CartView {
  return {
    cartId: null,
    userId,
    items: [],
    itemCount: 0,
    totalQuantity: 0,
    createdAt: null,
    updatedAt: null,
  }
}
```

---

## `backend/modules/cart/controller/cart.controller.ts`

```typescript
// ============================================================
// CART CONTROLLER - HTTP Handlers
// Phase 4 Step 2: Add To Cart
// Phase 4 Step 3: Cart Management (Get, Update, Remove, Clear)
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
  INVALID_QUANTITY_ZERO: 400,
  DUPLICATE_PRODUCT: 409,
  UNAUTHORIZED: 401,
}

// ----- Controller Implementation -----

export const CartController = {
  /**
   * POST /cart/items
   *
   * Add product to authenticated user's cart
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

  /**
   * GET /cart
   */
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const cartView = await CartService.getCart({
        userId: user.id,
      })

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
   */
  async updateQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await CartService.updateQuantity({
        userId: user.id,
        productId,
        quantity: parseResult.data.quantity,
      })

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
   */
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await CartService.removeItem({
        userId: user.id,
        productId,
      })

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
   */
  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await CartService.clearCart({
        userId: user.id,
      })

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
    throw error
  },
} as const
```

---

## `backend/modules/cart/cart.routes.ts`

```typescript
// ============================================================
// CART ROUTES
// Phase 4 Step 2: Add To Cart
// Phase 4 Step 3: Cart Management (Get, Update, Remove, Clear)
// ============================================================

import { Router } from "express"
import { CartController } from "./controller/cart.controller.js"
import { authenticate } from "../auth/auth.middleware.js"

const router = Router()

/**
 * POST /cart/items
 */
router.post(
  "/items",
  authenticate,
  CartController.addToCart
)

/**
 * GET /cart
 */
router.get(
  "/",
  authenticate,
  CartController.getCart
)

/**
 * PATCH /cart/items/:productId
 */
router.patch(
  "/items/:productId",
  authenticate,
  CartController.updateQuantity
)

/**
 * DELETE /cart/items/:productId
 */
router.delete(
  "/items/:productId",
  authenticate,
  CartController.removeItem
)

/**
 * DELETE /cart
 */
router.delete(
  "/",
  authenticate,
  CartController.clearCart
)

export default router
```

---

## `backend/modules/cart/validation/cart.validation.ts`

```typescript
// ============================================================
// CART VALIDATION (Zod Schemas)
// Step 1: Structural validation only
// Business validation: Step 2+ (assertProductExists, etc.)
// ============================================================

import { z } from "zod"
import { BUSINESS_LIMITS } from "../../../shared/config/business.config.js"

// ----- Add To Cart Schema -----
export const addToCartSchema = z.object({
  productId: z.number()
    .int("Product ID must be an integer")
    .positive("Product ID must be positive"),

  quantity: z.number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(
      BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY,
      `Quantity cannot exceed ${BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY}`
    )
    .optional()
    .default(1),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>

// ----- Update Cart Item Schema -----
export const updateCartItemSchema = z.object({
  quantity: z.number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(
      BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY,
      `Quantity cannot exceed ${BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY}`
    ),
})

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>

// ----- Remove From Cart Schema -----
export const removeFromCartSchema = z.object({
  productId: z.number()
    .int("Product ID must be an integer")
    .positive("Product ID must be positive"),
})

export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>

// ----- Schema Helpers -----
export const CartValidationMessages = {
  PRODUCT_ID_REQUIRED: "Product ID is required",
  PRODUCT_ID_INVALID: "Product ID must be a positive integer",
  QUANTITY_REQUIRED: "Quantity is required",
  QUANTITY_INVALID: "Quantity must be a positive integer",
  QUANTITY_TOO_LOW: "Quantity must be at least 1",
  QUANTITY_TOO_HIGH: (max: number) => `Quantity cannot exceed ${max}`,
} as const
```

---

## `backend/modules/order/order.service.ts`

```typescript
// ============================================================
// ORDER SERVICE — Domain Service
// Phase 4 Step 6: Order Draft Foundation
// Phase 4 Step 7: Add createDraftTx() for atomic transactions
// Phase 5 Step 1: Updated with financial fields and status filter
//
// Philosophy:
// - Order is a HISTORICAL RECORD
// - Order does NOT query Product after creation
// - createDraftTx: Accepts transaction client for atomic operations
// ============================================================

import { prisma } from '../../infra/db/prisma.js';
import { OrderRules } from './order.rules.js';
import { OrderMapper } from './order.mapper.js';
import type { Prisma } from '@prisma/client';
import type {
  CreateDraftInput,
  OrderDraft,
  OrderItemData,
} from './order.types.js';
import type { OrderStatus } from './order-lifecycle.types.js';
import { OrderStateTransitions } from './order-lifecycle.types.js';

export const OrderService = {
  /**
   * Create Draft — Order Domain Service
   *
   * Creates Order + OrderItems from Checkout Preview.
   * Order accepts COMPLETE preview - does NOT query Product.
   */
  async createDraft(input: CreateDraftInput): Promise<OrderDraft> {
    const { checkoutPreview } = input;

    // STEP 1: Validate preview is ready
    OrderRules.assertPreviewValid(checkoutPreview);
    OrderRules.assertPreviewHasItems(checkoutPreview);

    // STEP 2: Map preview items to order items (simple transform)
    const validItems = checkoutPreview.items.filter(
      (item) => item.status === 'VALID'
    );

    const orderItems: ReadonlyArray<OrderItemData> = validItems.map((item) =>
      OrderMapper.toOrderItemData(item)
    );

    // STEP 3: Calculate totals
    const totals = OrderMapper.calculateTotals(orderItems);

    // STEP 4: Calculate financial fields from checkout
    const shippingFee = input.shippingFee ?? 0;
    const adminFee = input.adminFee ?? 0;
    const total = totals.subtotal + shippingFee + adminFee;

    // STEP 5: Get shipping info
    const shipping = checkoutPreview.shipping;

    // STEP 6: Create Order + OrderItems
    const order = await prisma.order.create({
      data: {
        userId: checkoutPreview.summary.userId,
        status: 'DRAFT',
        totalQuantity: totals.totalQuantity,
        totalItemCount: totals.totalItemCount,
        subtotal: totals.subtotal,
        // 💰 FINANCIAL FIELDS
        shippingFee,
        tax: adminFee,
        total,
        // 📍 SHIPPING INFO (from checkout)
        shippingName: shipping?.recipientName,
        shippingPhone: shipping?.phone,
        shippingAddress: shipping?.address,
        shippingCity: shipping?.city,
        shippingPostalCode: shipping?.postalCode,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            productImage: item.productImage,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // STEP 7: Return draft
    return OrderMapper.toOrderDraft(order);
  },

  /**
   * Create Draft — Inside Transaction
   *
   * Creates Order + OrderItems within an existing transaction.
   */
  async createDraftTx(
    tx: Prisma.TransactionClient,
    input: CreateDraftInput
  ): Promise<OrderDraft> {
    const { checkoutPreview } = input;

    // STEP 1: Validate preview is ready
    OrderRules.assertPreviewValid(checkoutPreview);
    OrderRules.assertPreviewHasItems(checkoutPreview);

    // STEP 2: Map preview items to order items (simple transform)
    const validItems = checkoutPreview.items.filter(
      (item) => item.status === 'VALID'
    );

    const orderItems: ReadonlyArray<OrderItemData> = validItems.map((item) =>
      OrderMapper.toOrderItemData(item)
    );

    // STEP 3: Calculate totals
    const totals = OrderMapper.calculateTotals(orderItems);

    // STEP 4: Calculate financial fields from checkout
    const shippingFee = input.shippingFee ?? 0;
    const adminFee = input.adminFee ?? 0;
    const total = totals.subtotal + shippingFee + adminFee;

    // STEP 5: Get shipping info
    const shipping = checkoutPreview.shipping;

    // STEP 6: Create Order + OrderItems using transaction client
    const order = await tx.order.create({
      data: {
        userId: checkoutPreview.summary.userId,
        status: 'PROCESSING',
        totalQuantity: totals.totalQuantity,
        totalItemCount: totals.totalItemCount,
        subtotal: totals.subtotal,
        // 💰 FINANCIAL FIELDS
        shippingFee,
        tax: adminFee,
        total,
        // 📍 SHIPPING INFO (from checkout)
        shippingName: shipping?.recipientName,
        shippingPhone: shipping?.phone,
        shippingAddress: shipping?.address,
        shippingCity: shipping?.city,
        shippingPostalCode: shipping?.postalCode,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            productImage: item.productImage,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // STEP 7: Return draft
    return OrderMapper.toOrderDraft(order);
  },

  /**
   * Get Order by ID
   */
  async getOrder(orderId: number): Promise<OrderDraft | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return null;
    }

    return OrderMapper.toOrderDraft(order);
  },

  /**
   * Get Orders by User ID
   */
  async getOrdersByUser(
    userId: number,
    options?: {
      status?: OrderStatus | readonly OrderStatus[];
    }
  ): Promise<ReadonlyArray<OrderDraft>> {
    const whereClause: Prisma.OrderWhereInput = {
      userId,
    };

    if (options?.status) {
      // @ts-expect-error - Type compatibility with Prisma enum
      whereClause.status = options.status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => OrderMapper.toOrderDraft(order));
  },

  /**
   * Update Order Status
   */
  async updateStatus(orderId: number, newStatus: OrderStatus): Promise<OrderDraft> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const currentStatus = order.status as OrderStatus;
    const allowedTransitions = (OrderStateTransitions[currentStatus]?.canTransitionTo ?? []) as readonly OrderStatus[];

    if (!allowedTransitions.includes(newStatus as OrderStatus)) {
      throw new Error(`INVALID_STATE_TRANSITION: Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: true },
    });

    return OrderMapper.toOrderDraft(updatedOrder);
  },

  /**
   * Cancel Order
   */
  async cancelOrder(
    orderId: number,
    userId: number,
    reason?: string
  ): Promise<OrderDraft> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.userId !== userId) {
      throw new Error('FORBIDDEN');
    }

    const currentStatus = order.status as OrderStatus;
    const allowedTransitions = (OrderStateTransitions[currentStatus]?.canTransitionTo ?? []) as readonly OrderStatus[];

    if (!allowedTransitions.includes('CANCELLED' as OrderStatus)) {
      throw new Error(`INVALID_STATE_TRANSITION: Cannot cancel order in ${currentStatus} state`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
      },
      include: { items: true },
    });

    return OrderMapper.toOrderDraft(updatedOrder);
  },
} as const;
```

---

## `backend/modules/order/order.mapper.ts`

```typescript
// ============================================================
// ORDER MAPPER
// Phase 4 Step 6: Order Draft Foundation
// Phase 5 Step 1: Added financial fields
//
// Philosophy:
// - Mapper only TRANSFORMS data
// - Mapper does NOT contain business logic
// - Mapper does NOT query database
// ============================================================

import type {
  CheckoutItemPreview,
  CheckoutPreview,
} from '../checkout/checkout.types.js';
import type {
  OrderItemData,
  OrderTotals,
  OrderDraft,
  OrderItemSnapshot,
} from './order.types.js';
import type { OrderWithItems } from './order.types.js';
import type { OrderStatus } from './order-lifecycle.types.js';

// Extended order type with new fields (after schema update)
interface ExtendedOrderFields {
  shippingFee: unknown;
  tax: unknown;
  total: unknown;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
}

export const OrderMapper = {
  /**
   * Transform CheckoutItemPreview → OrderItemData
   */
  toOrderItemData(item: CheckoutItemPreview): OrderItemData {
    return {
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    };
  },

  /**
   * Calculate totals from order items
   */
  calculateTotals(items: ReadonlyArray<OrderItemData>): OrderTotals {
    return {
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      totalItemCount: items.length,
      subtotal: items.reduce((sum, i) => sum + i.subtotal, 0),
    };
  },

  /**
   * Transform Prisma Order → OrderDraft
   */
  toOrderDraft(order: OrderWithItems): OrderDraft {
    const items: ReadonlyArray<OrderItemSnapshot> = order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: (item as any).productImage || null,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    }));

    const extendedOrder = order as unknown as ExtendedOrderFields;

    return {
      id: order.id,
      userId: order.userId,
      status: order.status as OrderStatus,
      items,
      totalQuantity: order.totalQuantity,
      totalItemCount: order.totalItemCount,
      subtotal: Number(order.subtotal),
      shippingFee: Number(extendedOrder.shippingFee),
      adminFee: Number(extendedOrder.tax),
      total: Number(extendedOrder.total),
      shippingName: extendedOrder.shippingName ?? undefined,
      shippingPhone: extendedOrder.shippingPhone ?? undefined,
      shippingAddress: extendedOrder.shippingAddress ?? undefined,
      shippingCity: extendedOrder.shippingCity ?? undefined,
      shippingPostalCode: extendedOrder.shippingPostalCode ?? undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  },
} as const;
```
