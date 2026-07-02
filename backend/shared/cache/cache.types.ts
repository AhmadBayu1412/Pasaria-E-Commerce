/**
 * Cache type definitions
 */

// Result dari cache read
export interface CacheResult<T> {
  hit: boolean
  data: T | null
}

// Options untuk cache operations
export interface CacheOptions {
  ttl?: number
  skipCache?: boolean
}

// Metadata untuk debugging/monitoring
export interface CacheMetadata {
  key: string
  ttl: number
  createdAt: number
}
