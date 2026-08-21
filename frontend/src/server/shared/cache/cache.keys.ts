/**
 * Cache key builder utilities
 * Menghasilkan cache key yang konsisten untuk berbagai resources
 */

import { CACHE_KEYS } from "../config/cache.config"

/**
 * Partial input untuk search cache key
 */
export interface ProductSearchCacheInput {
  q?: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  category?: number
  seller?: number
  minPrice?: number
  maxPrice?: number
  inStock?: string
}

/**
 * Build key dengan prefix standard
 */
function buildKey(...parts: string[]): string {
  return [CACHE_KEYS.PREFIX, ...parts].join(":")
}

/**
 * Generate key untuk search results
 * Format: pasaria:products:search:<query_params>
 */
export function productSearchKey(input: ProductSearchCacheInput): string {
  const parts: string[] = []

  if (input.q) parts.push(`q=${input.q}`)
  if (input.page) parts.push(`p=${input.page}`)
  if (input.limit) parts.push(`l=${input.limit}`)
  if (input.sort) parts.push(`s=${input.sort}`)
  if (input.order) parts.push(`o=${input.order}`)
  if (input.category) parts.push(`cat=${input.category}`)
  if (input.seller) parts.push(`sel=${input.seller}`)
  if (input.minPrice) parts.push(`min=${input.minPrice}`)
  if (input.maxPrice) parts.push(`max=${input.maxPrice}`)
  if (input.inStock) parts.push(`stk=${input.inStock}`)

  const queryString = parts.length > 0 ? parts.join("&") : "all"
  return buildKey(CACHE_KEYS.NAMESPACES.PRODUCTS, "search", queryString)
}

/**
 * Generate key untuk single product detail
 * Format: pasaria:products:detail:<id>
 */
export function productDetailKey(id: number): string {
  return buildKey(CACHE_KEYS.NAMESPACES.PRODUCTS, "detail", String(id))
}

/**
 * Generate key untuk seller's product list
 * Format: pasaria:products:seller:<sellerId>
 */
export function sellerProductsKey(sellerId: number): string {
  return buildKey(CACHE_KEYS.NAMESPACES.PRODUCTS, "seller", String(sellerId))
}

/**
 * Pattern untuk invalidate semua search cache
 * Format: pasaria:products:search:*
 */
export function searchCachePattern(): string {
  return buildKey(CACHE_KEYS.NAMESPACES.PRODUCTS, "search", "*")
}

/**
 * Pattern untuk invalidate seller's cache
 * Format: pasaria:products:seller:<sellerId>
 */
export function sellerCachePattern(sellerId: number): string {
  return buildKey(CACHE_KEYS.NAMESPACES.PRODUCTS, "seller", String(sellerId))
}

// ============ CART CACHE KEYS (Step 9) ===============

/**
 * Build key for cart cache
 * Format: pasaria:cart:{userId}
 */
export function cartKey(userId: number): string {
  return buildKey(CACHE_KEYS.NAMESPACES.CART, String(userId));
}
