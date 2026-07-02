import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the redis client before importing cache service
vi.mock('../../../infra/cache/redis', () => ({
  redis: {
    isReady: true,
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    ping: vi.fn(),
  },
}))

// Import after mock
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  cacheGetOrSet,
  isRedisHealthy,
} from '../../../shared/cache/cache.service'
import { CACHE_TTL, CACHE_KEYS } from '../../../shared/config/cache.config'
import { redis } from '../../../infra/cache/redis'

describe("Cache Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("isRedisHealthy()", () => {
    it("should return true when Redis responds to ping", async () => {
      vi.mocked(redis.ping).mockResolvedValue("PONG")
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })

      const result = await isRedisHealthy()

      expect(result).toBe(true)
      expect(redis.ping).toHaveBeenCalled()
    })

    it("should return false when Redis is not ready", async () => {
      Object.defineProperty(redis, 'isReady', { value: false, configurable: true })

      const result = await isRedisHealthy()

      expect(result).toBe(false)
    })

    it("should return false when ping fails", async () => {
      vi.mocked(redis.ping).mockRejectedValue(new Error("Connection failed"))
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })

      const result = await isRedisHealthy()

      expect(result).toBe(false)
    })
  })

  describe("cacheGet()", () => {
    it("should return hit:true with data when key exists", async () => {
      const testData = { name: "Test Product", price: 10000 }
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(testData))

      const result = await cacheGet<typeof testData>("test-key")

      expect(result.hit).toBe(true)
      expect(result.data).toEqual(testData)
    })

    it("should return hit:false when key not found", async () => {
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })
      vi.mocked(redis.get).mockResolvedValue(null)

      const result = await cacheGet("non-existent-key")

      expect(result.hit).toBe(false)
      expect(result.data).toBeNull()
    })

    it("should return hit:false when Redis is not ready", async () => {
      Object.defineProperty(redis, 'isReady', { value: false, configurable: true })

      const result = await cacheGet("any-key")

      expect(result.hit).toBe(false)
      expect(result.data).toBeNull()
    })
  })

  describe("cacheSet()", () => {
    it("should store data with correct TTL", async () => {
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })
      vi.mocked(redis.set).mockResolvedValue("OK")

      const testData = { id: 1, name: "Test" }
      await cacheSet("test-key", testData, 300)

      expect(redis.set).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify(testData),
        { EX: 300 }
      )
    })

    it("should use default TTL when not specified", async () => {
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })
      vi.mocked(redis.set).mockResolvedValue("OK")

      await cacheSet("test-key", { data: "test" })

      expect(redis.set).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify({ data: "test" }),
        { EX: CACHE_TTL.SEARCH_RESULT }
      )
    })
  })

  describe("cacheDelete()", () => {
    it("should delete existing key", async () => {
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })
      vi.mocked(redis.del).mockResolvedValue(1)

      await cacheDelete("test-key")

      expect(redis.del).toHaveBeenCalledWith("test-key")
    })

    it("should not throw when Redis is not ready", async () => {
      Object.defineProperty(redis, 'isReady', { value: false, configurable: true })

      await expect(cacheDelete("any-key")).resolves.not.toThrow()
    })
  })

  describe("cacheDeletePattern()", () => {
    it("should delete all keys matching pattern", async () => {
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })
      vi.mocked(redis.keys).mockResolvedValue(["key1", "key2", "key3"] as any)
      vi.mocked(redis.del).mockResolvedValue(1)

      const count = await cacheDeletePattern("test:*")

      expect(count).toBe(3)
      expect(redis.keys).toHaveBeenCalledWith("test:*")
    })

    it("should return 0 when no keys match", async () => {
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })
      vi.mocked(redis.keys).mockResolvedValue([] as any)

      const count = await cacheDeletePattern("non-existent:*")

      expect(count).toBe(0)
    })
  })

  describe("cacheGetOrSet()", () => {
    it("should return cached data on cache hit", async () => {
      const cachedData = { id: 1, name: "Cached Product" }
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData))

      const fetcher = vi.fn()
      const result = await cacheGetOrSet("key", 300, fetcher)

      expect(result.hit).toBe(true)
      expect(result.data).toEqual(cachedData)
      expect(fetcher).not.toHaveBeenCalled()
    })

    it("should call fetcher and cache result on cache miss", async () => {
      Object.defineProperty(redis, 'isReady', { value: true, configurable: true })
      vi.mocked(redis.get).mockResolvedValue(null)
      vi.mocked(redis.set).mockResolvedValue("OK")

      const freshData = { id: 2, name: "Fresh Product" }
      const fetcher = vi.fn().mockResolvedValue(freshData)

      const result = await cacheGetOrSet("new-key", 300, fetcher)

      expect(result.hit).toBe(false)
      expect(result.data).toEqual(freshData)
      expect(fetcher).toHaveBeenCalled()
    })
  })
})

describe("Cache Config", () => {
  describe("CACHE_TTL", () => {
    it("should have SEARCH_RESULT TTL of 300 seconds", () => {
      expect(CACHE_TTL.SEARCH_RESULT).toBe(300)
    })

    it("should have PRODUCT_DETAIL TTL of 600 seconds", () => {
      expect(CACHE_TTL.PRODUCT_DETAIL).toBe(600)
    })

    it("should have CATEGORY_LIST TTL of 1800 seconds", () => {
      expect(CACHE_TTL.CATEGORY_LIST).toBe(1800)
    })

    it("should have SELLER_PRODUCTS TTL of 600 seconds", () => {
      expect(CACHE_TTL.SELLER_PRODUCTS).toBe(600)
    })
  })

  describe("CACHE_KEYS", () => {
    it("should have correct PREFIX", () => {
      expect(CACHE_KEYS.PREFIX).toBe("pasaria")
    })

    it("should have PRODUCTS namespace", () => {
      expect(CACHE_KEYS.NAMESPACES.PRODUCTS).toBe("products")
    })

    it("should have CATEGORIES namespace", () => {
      expect(CACHE_KEYS.NAMESPACES.CATEGORIES).toBe("categories")
    })

    it("should have USERS namespace", () => {
      expect(CACHE_KEYS.NAMESPACES.USERS).toBe("users")
    })
  })
})
