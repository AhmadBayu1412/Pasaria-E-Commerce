// modules/category/types/category.dto.ts

// ============================================================
// CATEGORY DTOs (Data Transfer Objects)
// Fokus: API contract ONLY
// ============================================================

// ----- Request DTOs -----
export interface CreateCategoryRequestDTO {
    readonly name: string
}

export interface UpdateCategoryRequestDTO {
    readonly name: string
}

// ----- Response DTOs -----
export interface CategoryResponseDTO {
    readonly id: number
    readonly name: string
    readonly createdAt: string
    readonly updatedAt: string
}

export interface CategoryListResponseDTO {
    readonly categories: CategoryResponseDTO[]
    readonly count: number
}

export interface CategoryMutationResponseDTO {
    readonly success: true
    readonly data: CategoryResponseDTO
    readonly message: string
}