// ============================================================
// CATEGORY VALIDATION UNIT TESTS
// ============================================================

import { describe, it, expect } from "vitest"
import { createCategorySchema, updateCategorySchema } from "../../../modules/category/validation/category.validation.js"

describe("Category Validation", () => {
    describe("createCategorySchema", () => {
        it("should accept valid category name", () => {
            const result = createCategorySchema.safeParse({ name: "Electronics" })
            expect(result.success).toBe(true)
        })

        it("should accept name with special characters (& and -)", () => {
            const result = createCategorySchema.safeParse({ name: "Food & Beverages" })
            expect(result.success).toBe(true)
        })

        it("should accept name with numbers", () => {
            const result = createCategorySchema.safeParse({ name: "Tech 2024" })
            expect(result.success).toBe(true)
        })

        it("should accept name with spaces", () => {
            const result = createCategorySchema.safeParse({ name: "Home Appliances" })
            expect(result.success).toBe(true)
        })

        it("should reject empty name", () => {
            const result = createCategorySchema.safeParse({ name: "" })
            expect(result.success).toBe(false)
        })

        it("should reject name with leading spaces", () => {
            const result = createCategorySchema.safeParse({ name: "  Electronics" })
            expect(result.success).toBe(false)
        })

        it("should reject name with trailing spaces", () => {
            const result = createCategorySchema.safeParse({ name: "Electronics  " })
            expect(result.success).toBe(false)
        })

        it("should reject name with special characters (@, !, #)", () => {
            const result = createCategorySchema.safeParse({ name: "Electronics@Store!" })
            expect(result.success).toBe(false)
        })

        it("should reject name with special characters (%, ^, *)", () => {
            const result = createCategorySchema.safeParse({ name: "Test%^&" })
            expect(result.success).toBe(false)
        })

        it("should reject name longer than 100 characters", () => {
            const result = createCategorySchema.safeParse({ name: "A".repeat(101) })
            expect(result.success).toBe(false)
        })

        it("should accept name with exactly 100 characters", () => {
            const result = createCategorySchema.safeParse({ name: "A".repeat(100) })
            expect(result.success).toBe(true)
        })

        it("should reject name with underscores", () => {
            const result = createCategorySchema.safeParse({ name: "Electronics_Store" })
            expect(result.success).toBe(false)
        })

        it("should reject name with dots", () => {
            const result = createCategorySchema.safeParse({ name: "Electronics.Store" })
            expect(result.success).toBe(false)
        })

        it("should reject name with parentheses", () => {
            const result = createCategorySchema.safeParse({ name: "Electronics (New)" })
            expect(result.success).toBe(false)
        })
    })

    describe("updateCategorySchema", () => {
        it("should accept valid update name", () => {
            const result = updateCategorySchema.safeParse({ name: "Consumer Electronics" })
            expect(result.success).toBe(true)
        })

        it("should reject empty name", () => {
            const result = updateCategorySchema.safeParse({ name: "" })
            expect(result.success).toBe(false)
        })

        it("should reject name with invalid characters", () => {
            const result = updateCategorySchema.safeParse({ name: "Test@123" })
            expect(result.success).toBe(false)
        })

        it("should reject name with leading/trailing spaces", () => {
            const result = updateCategorySchema.safeParse({ name: "  New Category  " })
            expect(result.success).toBe(false)
        })

        it("should apply same length validation as create", () => {
            const longResult = updateCategorySchema.safeParse({ name: "A".repeat(101) })
            expect(longResult.success).toBe(false)
        })
    })
})
