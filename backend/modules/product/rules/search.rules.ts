import { BusinessError } from "../../../shared/errors/business.error.js"
import { SEARCH_CONFIG } from "../validation/search.validation.js"

export function assertValidSortField(sort: string): void {
  if (!SEARCH_CONFIG.ALLOWED_SORT_FIELDS.includes(sort as typeof SEARCH_CONFIG.ALLOWED_SORT_FIELDS[number])) {
    throw new BusinessError(
      `Sort field tidak valid. Pilih: ${SEARCH_CONFIG.ALLOWED_SORT_FIELDS.join(", ")}`,
      400,
      "INVALID_SORT"
    )
  }
}

export function assertValidSortOrder(order: string): void {
  if (!SEARCH_CONFIG.ALLOWED_SORT_ORDERS.includes(order as typeof SEARCH_CONFIG.ALLOWED_SORT_ORDERS[number])) {
    throw new BusinessError(
      `Sort order tidak valid. Pilih: ${SEARCH_CONFIG.ALLOWED_SORT_ORDERS.join(", ")}`,
      400,
      "INVALID_SORT"
    )
  }
}

export function assertValidPagination(page: number, limit: number): void {
  if (page < 1) {
    throw new BusinessError("Page harus minimal 1", 400, "INVALID_PAGINATION")
  }

  if (limit < 1 || limit > SEARCH_CONFIG.MAX_LIMIT) {
    throw new BusinessError(
      `Limit harus antara 1 dan ${SEARCH_CONFIG.MAX_LIMIT}`,
      400,
      "INVALID_PAGINATION"
    )
  }
}

export function assertValidPriceRange(minPrice?: number, maxPrice?: number): void {
  if (minPrice !== undefined && maxPrice !== undefined) {
    if (minPrice > maxPrice) {
      throw new BusinessError(
        "Min price tidak boleh lebih besar dari max price",
        400,
        "INVALID_FILTER"
      )
    }
  }

  if (minPrice !== undefined && minPrice < 0) {
    throw new BusinessError("Min price tidak boleh negatif", 400, "INVALID_FILTER")
  }

  if (maxPrice !== undefined && maxPrice < 0) {
    throw new BusinessError("Max price tidak boleh negatif", 400, "INVALID_FILTER")
  }
}
