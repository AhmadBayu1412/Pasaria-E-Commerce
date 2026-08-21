// modules/product/types/image.dto.ts

// ============================================================
// IMAGE DTOs (Phase 3 Step 5)
// API contract only - no business logic
// ============================================================

// ----- Response DTOs -----

export interface ProductImageResponseDTO {
  readonly id: number
  readonly productId: number
  readonly path: string        // Local path
  readonly filename: string
  readonly mimeType: string
  readonly size: number
  readonly position: number
  readonly isPrimary: boolean
  readonly createdAt: string   // ISO 8601
}

export interface ProductImageListResponseDTO {
  readonly success: true
  readonly data: ProductImageResponseDTO[]
  readonly primaryImage: ProductImageResponseDTO | null
  readonly totalImages: number
}

export interface ImageUploadResponseDTO {
  readonly success: true
  readonly data: ProductImageResponseDTO
  readonly message: string
}

export interface ImageDeleteResponseDTO {
  readonly success: true
  readonly message: string
  readonly deletedId: number
}

export interface ImageReorderResponseDTO {
  readonly success: true
  readonly data: ProductImageResponseDTO[]
  readonly message: string
}

// ----- Error Response -----
export interface ImageErrorResponseDTO {
  readonly success: false
  readonly error: string
  readonly code: ImageErrorCode
}

// ----- Error Codes -----
export type ImageErrorCode =
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "MAX_IMAGES_EXCEEDED"
  | "IMAGE_NOT_FOUND"
  | "NOT_OWNER"
  | "INVALID_POSITION"
  | "PRODUCT_NOT_FOUND"

// ----- Pagination (future) -----
// export interface PaginatedImagesResponseDTO { ... }