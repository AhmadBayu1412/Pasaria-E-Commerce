export interface PricingResponseDTO {
  readonly productId: number
  readonly basePrice: string
  readonly discountPrice: string | null
  readonly effectivePrice: string
  readonly currency: string
  readonly hasDiscount: boolean
  readonly updatedAt: string
}

export interface PricingUpdateResponseDTO {
  readonly success: true
  readonly data: PricingResponseDTO
  readonly message: string
}

export interface PricingErrorResponseDTO {
  readonly success: false
  readonly error: string
  readonly code: PricingErrorCode
}

export type PricingErrorCode =
  | "INVALID_PRICE"
  | "PRICE_TOO_LOW"
  | "PRICE_TOO_HIGH"
  | "DISCOUNT_EXCEEDS_BASE"
  | "DISCOUNT_NEGATIVE"
  | "PRODUCT_NOT_FOUND"
  | "NOT_OWNER"
  | "INVALID_DECIMAL_FORMAT"
