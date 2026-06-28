
// ============================================================
// PRODUCT DTOs (Data Transfer Objects)
// Fokus: API contract ONLY, tidak ada validasi
// ============================================================

// ----- Request DTOs (plain interfaces) -----
export interface CreateProductRequestDTO {
    readonly name: string
    readonly description?: string
    readonly price: number
    readonly stock?: number
}

export interface UpdateProductRequestDTO {
    readonly name: string
    readonly description?: string
    readonly price: number
    readonly stock?: number
}

// ----- Response DTOs (plain interfaces) -----

export interface ProductResponseDTO {
    readonly id: number 
    readonly name: string 
    readonly description: string | null
    readonly price: number
    readonly stock: number
    readonly sellerId: number
    readonly createdAt: string // ISO 8601
    readonly updatedAt: string // ISO 8601
}
export interface ProductListResponseDTO {
    readonly products: ProductResponseDTO[]
    readonly count: number
}
export interface ProductMutationResponseDTO {
    readonly success: true
    readonly data: ProductResponseDTO
    readonly message: string
}

// ----- Query DTOs: Tidak ada di step 1 -----
