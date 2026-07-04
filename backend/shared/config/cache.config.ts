/**
 * Cache configuration constants
 * TTL values dan key namespace untuk caching
 */

// TTL dalam detik
export const CACHE_TTL = {
  SEARCH_RESULT: 300,     // 5 menit
  PRODUCT_DETAIL: 600,    // 10 menit
  CATEGORY_LIST: 1800,   // 30 menit
  SELLER_PRODUCTS: 600,  // 10 menit
  CART: 300,             // 5 menit - Step 9
} as const

// Key namespace
export const CACHE_KEYS = {
  PREFIX: 'pasaria',
  NAMESPACES: {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    USERS: 'users',
    CART: 'cart', // Step 9
  },
} as const

// Type exports
export type CacheTTLKey = keyof typeof CACHE_TTL
export type CacheNamespace = typeof CACHE_KEYS.NAMESPACES[keyof typeof CACHE_KEYS.NAMESPACES]
