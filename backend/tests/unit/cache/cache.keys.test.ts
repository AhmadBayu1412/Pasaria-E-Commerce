import { describe, it, expect } from "vitest"
import {
  productSearchKey,
  productDetailKey,
  sellerProductsKey,
  searchCachePattern,
  sellerCachePattern,
} from "../../../shared/cache/cache.keys"

describe("Cache Keys", () => {
  describe("productSearchKey()", () => {
    it("should build key with all parameters", () => {
      const key = productSearchKey({
        q: "laptop",
        page: 1,
        limit: 20,
        sort: "price",
        order: "asc",
        category: 1,
        seller: 5,
        minPrice: 10000,
        maxPrice: 50000,
        inStock: "true",
      })

      expect(key).toContain("pasaria:products:search:")
      expect(key).toContain("q=laptop")
      expect(key).toContain("p=1")
      expect(key).toContain("l=20")
      expect(key).toContain("s=price")
      expect(key).toContain("o=asc")
      expect(key).toContain("cat=1")
      expect(key).toContain("sel=5")
      expect(key).toContain("min=10000")
      expect(key).toContain("max=50000")
      expect(key).toContain("stk=true")
    })

    it("should build key with only q parameter", () => {
      const key = productSearchKey({ q: "mouse" })

      expect(key).toBe("pasaria:products:search:q=mouse")
    })

    it("should build key with no parameters (all)", () => {
      const key = productSearchKey({})

      expect(key).toBe("pasaria:products:search:all")
    })

    it("should handle special characters in query", () => {
      const key = productSearchKey({ q: "laptop gaming" })

      expect(key).toBe("pasaria:products:search:q=laptop gaming")
    })

    it("should have correct prefix", () => {
      const key = productSearchKey({ q: "test" })

      expect(key.startsWith("pasaria:products:search:")).toBe(true)
    })

    it("should generate same key for same parameters", () => {
      const key1 = productSearchKey({ q: "laptop", page: 1 })
      const key2 = productSearchKey({ q: "laptop", page: 1 })

      expect(key1).toBe(key2)
    })

    it("should generate different key for different page", () => {
      const key1 = productSearchKey({ q: "laptop", page: 1 })
      const key2 = productSearchKey({ q: "laptop", page: 2 })

      expect(key1).not.toBe(key2)
    })
  })

  describe("productDetailKey()", () => {
    it("should build key with product ID", () => {
      const key = productDetailKey(15)

      expect(key).toBe("pasaria:products:detail:15")
    })

    it("should have correct format", () => {
      const key = productDetailKey(123)

      expect(key).toMatch(/^pasaria:products:detail:\d+$/)
    })

    it("should convert number to string", () => {
      const key = productDetailKey(1)

      expect(typeof key).toBe("string")
      expect(key).toBe("pasaria:products:detail:1")
    })
  })

  describe("sellerProductsKey()", () => {
    it("should build key with seller ID", () => {
      const key = sellerProductsKey(5)

      expect(key).toBe("pasaria:products:seller:5")
    })

    it("should have correct format", () => {
      const key = sellerProductsKey(123)

      expect(key).toMatch(/^pasaria:products:seller:\d+$/)
    })
  })

  describe("searchCachePattern()", () => {
    it("should return wildcard pattern for invalidation", () => {
      const pattern = searchCachePattern()

      expect(pattern).toBe("pasaria:products:search:*")
    })

    it("should match all search keys", () => {
      const pattern = searchCachePattern()

      expect(pattern).toContain("*")
    })
  })

  describe("sellerCachePattern()", () => {
    it("should return seller-specific pattern", () => {
      const pattern = sellerCachePattern(5)

      expect(pattern).toBe("pasaria:products:seller:5")
    })

    it("should match only that seller's cache", () => {
      const pattern = sellerCachePattern(1)

      expect(pattern).toBe("pasaria:products:seller:1")
      expect(pattern).not.toBe(sellerCachePattern(2))
    })
  })
})
