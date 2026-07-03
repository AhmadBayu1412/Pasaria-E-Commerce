// ============================================================
// INVENTORY DOMAIN TYPES
// Phase 4 Step 4: Inventory Foundation
// Phase 4 Step 5: Added Application Service types
// Phase 4 Step 7: Added Transaction types for reserve/release
//
// Minimal types - returns data for Step 5 (Checkout)
// Step 7: Extended for atomic transaction support
// ============================================================

import type { Prisma } from "@prisma/client"

// ----- Existing Types -----
export interface ValidateStockInput {
  readonly productId: number;
  readonly quantity: number;
}

// Returns product data so Checkout (Step 5) doesn't need to query again
export interface ValidateStockResult {
  readonly productId: number;
  readonly availableStock: number;
}

// ============================================================
// STEP 5: APPLICATION SERVICE USE TYPES
// ============================================================

/**
 * Input for validateCartItemForCheckout (Application Service use)
 */
export interface ValidateCartItemForCheckoutInput {
  readonly productId: number;
  readonly quantity: number;
}

/**
 * Result for validateCartItemForCheckout (Application Service use)
 * Returns status with reason instead of throwing
 */
export interface ValidateCartItemForCheckoutResult {
  readonly productId: number;
  readonly requestedQuantity: number;
  readonly availableStock: number;
  readonly status: "VALID" | "INVALID";
  readonly reason?: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK";
}

// ============================================================
// STEP 7: TRANSACTION TYPES
// ============================================================

/**
 * Reserve Stock Input — Domain-friendly
 * Only what Inventory domain needs to know
 * Does NOT know about Order, Checkout, or Payment
 */
export interface ReserveStockInput {
  readonly productId: number;
  readonly quantity: number;
}

/**
 * Reserve Stock Result — Minimal
 */
export interface ReserveStockResult {
  readonly productId: number;
  readonly reservedQuantity: number;
  readonly remainingStock: number;
}

/**
 * Release Stock Input — Interface only in Step 7
 * Implementation deferred to Step 8
 */
export interface ReleaseStockInput {
  readonly productId: number;
  readonly quantity: number;
  readonly reason: "CANCELLED" | "EXPIRED";
}

/**
 * Prisma Transaction Client type
 */
export type TransactionClient = Prisma.TransactionClient;
