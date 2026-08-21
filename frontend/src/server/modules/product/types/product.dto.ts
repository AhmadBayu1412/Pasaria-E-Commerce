
// ============================================================
// PRODUCT DTOs (Data Transfer Objects)
// Fokus: API contract ONLY
// ============================================================

// ----- Request DTOs (plain interfaces) -----
export interface CreateProductRequestDTO {
    readonly name: string
    readonly description?: string
    readonly price: number
    readonly availableStock?: number  // Phase 3 Step 4 - default 0
    readonly reservedStock?: number   // Phase 3 Step 4 - default 0
    readonly categoryId?: number  // Phase 3 Step 2 - Category relation
}

export interface UpdateProductRequestDTO {
    readonly name?: string
    readonly description?: string
    readonly price?: number
    readonly availableStock?: number  // Phase 3 Step 4
    readonly reservedStock?: number   // Phase 3 Step 4
    readonly categoryId?: number | null  // Phase 3 Step 2 - Category relation (nullable untuk unset)
}

// ----- Pagination Query DTO -----
export interface PaginationParamsDTO {
  readonly page?: number
  readonly limit?: number
  readonly sortBy?: "name" | "price" | "createdAt" | "stock"
  readonly sortOrder?: "asc" | "desc"
  readonly category?: number // Filter by category ID
}

// ----- Response DTOs -----
export interface ProductImageDTO {
    readonly id: number
    readonly url: string
    readonly filename: string
    readonly mimeType: string
    readonly isPrimary: boolean
}

export interface ProductResponseDTO {
    readonly id: number
    readonly name: string
    readonly description: string | null
    readonly price: number
    // --- Inventory Fields (Phase 3 Step 4) ---
    readonly availableStock: number
    readonly reservedStock: number
    readonly totalStock: number  // computed: available + reserved
    // -------------------------------------------
    readonly sellerId: number
    readonly categoryId: number | null  // Phase 3 Step 2 - Category relation
    readonly images: ProductImageDTO[]
    readonly createdAt: string // ISO 8601
    readonly updatedAt: string // ISO 8601
}
export interface ProductListResponseDTO {
    readonly products: ProductResponseDTO[]
    readonly count: number
}

// ----- NEW: Paginated Response DTO -----
export interface PaginationMeta {
    readonly page: number
    readonly limit: number
    readonly total: number
    readonly totalPages: number
    readonly hasNext: boolean
    readonly hasPrev: boolean
}

export interface PaginatedProductResponseDTO {
    readonly success: true
    readonly data: ProductResponseDTO[]
    readonly pagination: PaginationMeta
}

export interface ProductMutationResponseDTO {
    readonly success: true
    readonly data: ProductResponseDTO
    readonly message: string
}

// ======= INVENTORY DTOs =======

export interface InventoryResponseDTO {
    readonly productId: number
    readonly availableStock: number
    readonly reservedStock: number
    readonly totalStock: number
    readonly updatedAt: string
}

export interface StockAdjustmentResponseDTO {
    readonly success: boolean
    readonly data: InventoryResponseDTO
    readonly message: string
}

export interface ReservationResponseDTO {
    readonly success: boolean
    readonly data: {
        readonly productId: number
        readonly reservedQuantity: number
        readonly remainingAvailable: number
    }
    readonly error?: string
    readonly code?: "INSUFFICIENT_STOCK" | "PRODUCT_NOT_FOUND"
}

// Update existing ProductResponseDTO to include new stock fields
// (Ganti stock: number → availableStock: number, reservedStock: number)
