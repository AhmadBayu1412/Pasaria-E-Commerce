/**
 * Extended Cache Service
 * Cache-aside pattern dengan graceful fallback
 * Extends existing cache functions untuk product caching
 */

import { redis } from "../../infra/cache/redis"
import { CACHE_TTL } from "../config/cache.config"
import type { CacheResult } from "./cache.types"

// ============ EXISTING FUNCTIONS (for session) ===============

export async function getCache<T>(
    key: string
): Promise<T | null> {
    try {
        if(!redis.isReady){
            console.log("[CACHE SKIPPED] - Redis not ready")
            return null
        }
        const data = await redis.get(key)
        if(!data) return null
        return JSON.parse(data)
    } catch (err) {
        console.error("[CACHE GET ERROR]", err)
        return null
    }
}

export async function setCache(
    key: string,
    value: unknown,
    ttl = 300
): Promise<void> {
    try {
        if (!redis.isReady) return
        await redis.set(
            key,
            JSON.stringify(value),
            { EX: ttl}
        )
    } catch (err) {
        console.error("[CACHE SET ERROR]", err)
    }
}

export async function deleteCache(
    key: string
): Promise<void> {
    try {
        if (!redis.isReady) return
        await redis.del(key)
    } catch (err) {
        console.error("[CACHE DELETE ERROR]", err)
    }
}

export async function setCacheWithTTL(
    key: string,
    value: unknown,
    ttl: number
): Promise<void> {
    try {
        if (!redis.isReady) return
        await redis.set(
            key,
            JSON.stringify(value),
            { EX: ttl}
        )
    } catch (err) {
        console.error("[CACHE SET TTL ERROR]", err)
    }
}

// ============ NEW FUNCTIONS (for product caching) ===============

/**
 * Check if Redis is healthy and ready
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    if (!redis.isReady) {
      return false
    }
    const result = await redis.ping()
    return result === "PONG"
  } catch {
    return false
  }
}

/**
 * Get data from cache with CacheResult format
 */
export async function cacheGet<T>(key: string): Promise<CacheResult<T>> {
  try {
    if (!redis.isReady) {
      return { hit: false, data: null }
    }
    const data = await redis.get(key)
    if (data) {
      return { hit: true, data: JSON.parse(data) as T }
    }
    return { hit: false, data: null }
  } catch (error) {
    console.warn(`[Cache] Get failed for key ${key}:`, error)
    return { hit: false, data: null }
  }
}

/**
 * Set data to cache with TTL
 */
export async function cacheSet<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL.SEARCH_RESULT
): Promise<void> {
  try {
    if (!redis.isReady) {
      return
    }
    await redis.set(key, JSON.stringify(data), { EX: ttl })
  } catch (error) {
    console.warn(`[Cache] Set failed for key ${key}:`, error)
  }
}

/**
 * Delete a single key from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    if (!redis.isReady) {
      return
    }
    await redis.del(key)
  } catch (error) {
    console.warn(`[Cache] Delete failed for key ${key}:`, error)
  }
}

/**
 * Delete keys matching a pattern (for invalidation)
 * Returns count of deleted keys
 * Note: KEYS is fine for development/small datasets, use SCAN in production
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    if (!redis.isReady) {
      return 0
    }

    // Get all keys matching pattern
    const keysResult = await redis.keys(pattern)
    const keys: string[] = []

    // Convert RedisArray to string array
    for (let i = 0; i < keysResult.length; i++) {
      keys.push(String(keysResult[i]))
    }

    if (keys.length === 0) {
      return 0
    }

    // Delete all matching keys one by one
    for (const key of keys) {
      await redis.del(key)
    }

    return keys.length
  } catch (error) {
    console.warn(`[Cache] DeletePattern failed for ${pattern}:`, error)
    return 0
  }
}

/**
 * Cache-aside pattern: Get or Set
 * Returns cached data if exists, otherwise fetches from source and caches it
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<CacheResult<T>> {
  // Step 1: Try cache first
  const cached = await cacheGet<T>(key)
  if (cached.hit && cached.data !== null) {
    return cached
  }

  // Step 2: Cache miss - fetch from source
  const data = await fetcher()

  // Step 3: Store in cache (fire and forget)
  cacheSet(key, data, ttl).catch(() => {})

  return { hit: false, data }
}
