import { describe, it, expect } from "vitest"
import {
  searchProductsSchema,
  SEARCH_CONFIG
} from "../../../modules/product/validation/search.validation"

describe("Search Validation", () => {

  describe("searchProductsSchema", () => {
    it("should accept empty query", () => {
      const result = searchProductsSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.q).toBe("")
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it("should accept valid search query", () => {
      const result = searchProductsSchema.safeParse({
        q: "iphone"
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.q).toBe("iphone")
      }
    })

    it("should accept valid pagination", () => {
      const result = searchProductsSchema.safeParse({
        page: "2",
        limit: "10"
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(10)
      }
    })

    it("should accept valid sort parameters", () => {
      const result = searchProductsSchema.safeParse({
        sort: "name",
        order: "asc"
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sort).toBe("name")
        expect(result.data.order).toBe("asc")
      }
    })

    it("should accept price sort", () => {
      const result = searchProductsSchema.safeParse({
        sort: "price"
      })
      expect(result.success).toBe(true)
    })

    it("should accept createdAt sort", () => {
      const result = searchProductsSchema.safeParse({
        sort: "createdAt"
      })
      expect(result.success).toBe(true)
    })

    it("should accept effectivePrice sort", () => {
      const result = searchProductsSchema.safeParse({
        sort: "effectivePrice"
      })
      expect(result.success).toBe(true)
    })

    it("should accept category filter", () => {
      const result = searchProductsSchema.safeParse({
        category: "1"
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe(1)
      }
    })

    it("should accept seller filter", () => {
      const result = searchProductsSchema.safeParse({
        seller: "5"
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.seller).toBe(5)
      }
    })

    it("should accept price range", () => {
      const result = searchProductsSchema.safeParse({
        minPrice: "10000",
        maxPrice: "100000"
      })
      expect(result.success).toBe(true)
    })

    it("should accept inStock filter", () => {
      const result = searchProductsSchema.safeParse({
        inStock: "true"
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.inStock).toBe("true")
      }
    })

    it("should reject invalid sort field", () => {
      const result = searchProductsSchema.safeParse({
        sort: "invalid"
      })
      expect(result.success).toBe(false)
    })

    it("should reject invalid order", () => {
      const result = searchProductsSchema.safeParse({
        order: "random"
      })
      expect(result.success).toBe(false)
    })

    it("should reject page less than 1", () => {
      const result = searchProductsSchema.safeParse({
        page: "0"
      })
      expect(result.success).toBe(false)
    })

    it("should reject negative page", () => {
      const result = searchProductsSchema.safeParse({
        page: "-1"
      })
      expect(result.success).toBe(false)
    })

    it("should reject limit greater than 100", () => {
      const result = searchProductsSchema.safeParse({
        limit: "101"
      })
      expect(result.success).toBe(false)
    })

    it("should reject limit less than 1", () => {
      const result = searchProductsSchema.safeParse({
        limit: "0"
      })
      expect(result.success).toBe(false)
    })

    it("should accept all valid filters combined", () => {
      const result = searchProductsSchema.safeParse({
        q: "laptop",
        page: "1",
        limit: "20",
        sort: "price",
        order: "asc",
        category: "1",
        seller: "2",
        minPrice: "10000",
        maxPrice: "50000",
        inStock: "true"
      })
      expect(result.success).toBe(true)
    })
  })

  describe("SEARCH_CONFIG", () => {
    it("should have correct defaults", () => {
      expect(SEARCH_CONFIG.DEFAULT_PAGE).toBe(1)
      expect(SEARCH_CONFIG.DEFAULT_LIMIT).toBe(20)
      expect(SEARCH_CONFIG.MAX_LIMIT).toBe(100)
    })

    it("should have allowed sort fields", () => {
      expect(SEARCH_CONFIG.ALLOWED_SORT_FIELDS).toContain("name")
      expect(SEARCH_CONFIG.ALLOWED_SORT_FIELDS).toContain("price")
      expect(SEARCH_CONFIG.ALLOWED_SORT_FIELDS).toContain("createdAt")
      expect(SEARCH_CONFIG.ALLOWED_SORT_FIELDS).toContain("effectivePrice")
    })

    it("should have allowed sort orders", () => {
      expect(SEARCH_CONFIG.ALLOWED_SORT_ORDERS).toContain("asc")
      expect(SEARCH_CONFIG.ALLOWED_SORT_ORDERS).toContain("desc")
    })
  })
})
