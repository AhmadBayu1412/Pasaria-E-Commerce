import type { Prisma } from "@prisma/client"

// ============================================================
// PRODUCT DOMAIN TYPES (Anemic Model)
// Fokus: type safety, bukan rich behavior
// ============================================================

// --------------- Aggregate Root -------------------
export interface Product {
   readonly id: number;
   readonly name: string;
   readonly description: string | null;
   readonly price: number;
   // --- Inventory Fields (Phase 3 Step 4) ---
   readonly availableStock: number;
   readonly reservedStock: number;
   // totalStock = availableStock + reservedStock (computed)
   // -------------------------------------------
   readonly sellerId: number;
   readonly categoryId: number | null;  // Phase 3 Step 2 - Category relation
   readonly createdAt: Date;
   readonly updatedAt: Date;
}
 
// --------------- Input Types (service layer) -------------------
export interface CreateProductInput {
   readonly name: string;
   readonly description?: string;
   readonly price: number;
   readonly availableStock?: number;  // Phase 3 Step 4 - default 0
   readonly reservedStock?: number;  // Phase 3 Step 4 - default 0
   readonly categoryId?: number;  // Phase 3 Step 2 - Category relation
}

export interface UpdateProductInput {
   readonly name?: string;
   readonly description?: string;
   readonly price?: number;
   readonly availableStock?: number;  // Phase 3 Step 4
   readonly reservedStock?: number;  // Phase 3 Step 4
   readonly categoryId?: number | null;  // Phase 3 Step 2 - Category relation (nullable untuk unset)
}
// Note: sellerId tidak boleh diubah setelah product dibuat

// ======= INVENTORY TYPES =======

// Inventory state (returned from getInventory)
export interface InventoryState {
   readonly productId: number
   readonly availableStock: number
   readonly reservedStock: number
   readonly totalStock: number  // computed: available + reserved
}

// Inventory DTO (re-exported from product.dto.ts for convenience)
export type { InventoryResponseDTO } from "./product.dto"

// Operation input types
export interface IncreaseStockInput {
   readonly productId: number
   readonly quantity: number
}

export interface DecreaseStockInput {
   readonly productId: number
   readonly quantity: number
}

export interface ReserveStockInput {
   readonly productId: number
   readonly quantity: number
}

export interface ReleaseStockInput {
   readonly productId: number
   readonly quantity: number
}

// Operation result types
export interface StockAdjustmentResult {
   readonly productId: number
   readonly previousAvailable: number
   readonly newAvailable: number
}

export interface ReservationResult {
   readonly success: boolean
   readonly productId: number
   readonly reservedQuantity: number
   readonly remainingAvailable: number
   readonly error?: string
   readonly code?: "INSUFFICIENT_STOCK" | "PRODUCT_NOT_FOUND"
}