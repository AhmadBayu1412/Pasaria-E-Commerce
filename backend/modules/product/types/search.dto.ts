export interface ProductSearchSummaryDTO {
  readonly id: number
  readonly name: string
  readonly slug: string
  readonly description: string | null
  readonly effectivePrice: string
  readonly basePrice: string
  readonly discountPrice: string | null
  readonly hasDiscount: boolean
  readonly currency: string
  readonly primaryImage: {
    readonly id: number
    readonly path: string
  } | null
  readonly category: {
    readonly id: number
    readonly name: string
  } | null
  readonly seller: {
    readonly id: number
  }
  readonly availableStock: number
  readonly hasStock: boolean
}

export interface SearchPaginationDTO {
  readonly page: number
  readonly limit: number
  readonly total: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly hasPrevPage: boolean
}

export interface SearchFiltersDTO {
  readonly query: string | null
  readonly category: number | null
  readonly seller: number | null
  readonly minPrice: number | null
  readonly maxPrice: number | null
  readonly inStock: boolean | null
  readonly sort: string
  readonly order: string
}

export interface SearchResponseDTO {
  readonly success: true
  readonly data: ProductSearchSummaryDTO[]
  readonly pagination: SearchPaginationDTO
  readonly filters: SearchFiltersDTO
}

export interface SearchErrorDTO {
  readonly success: false
  readonly error: string
  readonly code: SearchErrorCode
}

export type SearchErrorCode =
  | "INVALID_PAGINATION"
  | "INVALID_SORT"
  | "INVALID_FILTER"
  | "SEARCH_ERROR"
