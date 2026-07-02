/**
 * Cache module exports
 */

// Service functions
export {
  // Session functions (existing)
  getCache,
  setCache,
  deleteCache,
  setCacheWithTTL,
  // Product cache functions (new)
  isRedisHealthy,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  cacheGetOrSet,
} from "./cache.service.js"

// Key builders
export {
  productSearchKey,
  productDetailKey,
  sellerProductsKey,
  searchCachePattern,
  sellerCachePattern,
} from "./cache.keys.js"
export type { ProductSearchCacheInput } from "./cache.keys.js"

// Config
export { CACHE_TTL, CACHE_KEYS } from "../config/cache.config.js"

// Types
export type { CacheResult, CacheOptions, CacheMetadata } from "./cache.types.js"
