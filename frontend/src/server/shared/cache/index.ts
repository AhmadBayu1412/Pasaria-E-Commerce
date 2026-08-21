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
} from "./cache.service"

// Key builders
export {
  productSearchKey,
  productDetailKey,
  sellerProductsKey,
  searchCachePattern,
  sellerCachePattern,
} from "./cache.keys"
export type { ProductSearchCacheInput } from "./cache.keys"

// Config
export { CACHE_TTL, CACHE_KEYS } from "../config/cache.config"

// Types
export type { CacheResult, CacheOptions, CacheMetadata } from "./cache.types"
