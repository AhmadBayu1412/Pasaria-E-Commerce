
// ============================================================
// PRODUCT DTOs (Data Transfer Objects)
// Fokus: API contract ONLY
// ============================================================

// ----- Request DTOs (plain interfaces) -----
export interface CreateProductRequestDTO {
    readonly name: string
    readonly description?: string
    readonly price: number
    readonly stock?: number
    readonly categoryId?: number  // Phase 3 Step 2 - Category relation
}

export interface UpdateProductRequestDTO {
    readonly name?: string
    readonly description?: string
    readonly price?: number
    readonly stock?: number
    readonly categoryId?: number | null  // Phase 3 Step 2 - Category relation (nullable untuk unset)
}

// ----- Pagination Query DTO -----
export interface PaginationParamsDTO {
  readonly page?: number
  readonly limit?: number
  readonly sortBy?: "name" | "price" | "createdAt" | "stock"
  readonly sortOrder?: "asc" | "desc"
}

// ----- Response DTOs -----

export interface ProductResponseDTO {
    readonly id: number
    readonly name: string
    readonly description: string | null
    readonly price: number
    readonly stock: number
    readonly sellerId: number
    readonly categoryId: number | null  // Phase 3 Step 2 - Category relation
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

