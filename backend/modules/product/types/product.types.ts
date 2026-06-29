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
   readonly stock: number;
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
   readonly stock?: number;
   readonly categoryId?: number;  // Phase 3 Step 2 - Category relation
}

export interface UpdateProductInput {
   readonly name?: string;
   readonly description?: string;
   readonly price?: number;
   readonly stock?: number;
   readonly categoryId?: number | null;  // Phase 3 Step 2 - Category relation (nullable untuk unset)
}
// Note: sellerId tidak boleh diubah setelah product dibuat

