import { describe, it, expect } from "vitest"
import {
    createProductSchema,
    updateProductSchema,
    paginationQuerySchema
} from "../../../modules/product/validation/product.validation.js"

describe("Product Validation Schemas", () => {
    describe("paginationQuerySchema", () => {
        it("should accept valid pagination params", () => {
        const input = {
            page: "2",
            limit: "25",
            sortBy: "price",
            sortOrder: "asc"
        }
        
        const result = paginationQuerySchema.safeParse(input)
        
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.page).toBe(2)
            expect(result.data.limit).toBe(25)
            expect(result.data.sortBy).toBe("price")
            expect(result.data.sortOrder).toBe("asc")
        }
        })

        it("should apply defaults for missing params", () => {
        const result = paginationQuerySchema.safeParse({})
        
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.page).toBe(1)
            expect(result.data.limit).toBe(20)
            expect(result.data.sortBy).toBe("createdAt")
            expect(result.data.sortOrder).toBe("desc")
        }
        })

        it("should reject page less than 1", () => {
        const result = paginationQuerySchema.safeParse({ page: "0" })
        
        expect(result.success).toBe(false)
        })

        it("should reject limit greater than 100", () => {
        const result = paginationQuerySchema.safeParse({ limit: "101" })
        
        expect(result.success).toBe(false)
        })

        it("should reject invalid sortBy value", () => {
        const result = paginationQuerySchema.safeParse({ sortBy: "invalid" })
        
        expect(result.success).toBe(false)
        })

        it("should reject invalid sortOrder value", () => {
        const result = paginationQuerySchema.safeParse({ sortOrder: "invalid" })
        
        expect(result.success).toBe(false)
        })

        it("should coerce string numbers to integers", () => {
        const result = paginationQuerySchema.safeParse({ page: "5", limit: "50" })
        
        expect(result.success).toBe(true)
        if (result.success) {
            expect(typeof result.data.page).toBe("number")
            expect(typeof result.data.limit).toBe("number")
        }
        })
    })

    describe("createProductSchema", () => {
        it("should accept valid product input", () => {
        const input = {
            name: "Test Product",
            description: "A test product",
            price: 99.99,
            availableStock: 10,
            categoryId: 1
        }

        const result = createProductSchema.safeParse(input)

        expect(result.success).toBe(true)
        })

        it("should reject empty name", () => {
        const result = createProductSchema.safeParse({
            name: "",
            price: 99.99
        })
        
        expect(result.success).toBe(false)
        })

        it("should reject name longer than 255 chars", () => {
        const result = createProductSchema.safeParse({
            name: "a".repeat(256),
            price: 99.99
        })
        
        expect(result.success).toBe(false)
        })

        it("should reject negative price", () => {
        const result = createProductSchema.safeParse({
            name: "Test",
            price: -10
        })
        
        expect(result.success).toBe(false)
        })

        it("should reject zero price", () => {
        const result = createProductSchema.safeParse({
            name: "Test",
            price: 0
        })
        
        expect(result.success).toBe(false)
        })

        it("should reject negative availableStock", () => {
        const result = createProductSchema.safeParse({
            name: "Test",
            price: 99.99,
            availableStock: -1
        })

        expect(result.success).toBe(false)
        })

        it("should reject non-integer availableStock", () => {
        const result = createProductSchema.safeParse({
            name: "Test",
            price: 99.99,
            availableStock: 1.5
        })

        expect(result.success).toBe(false)
        })

        it("should accept optional fields as undefined", () => {
        const result = createProductSchema.safeParse({
            name: "Test",
            price: 99.99
        })
        
        expect(result.success).toBe(true)
        })

        it("should accept negative categoryId", () => {
        const result = createProductSchema.safeParse({
            name: "Test",
            price: 99.99,
            categoryId: -1
        })
        
        expect(result.success).toBe(false)
        })
    })

    describe("updateProductSchema", () => {
        it("should accept partial update", () => {
        const result = updateProductSchema.safeParse({
            name: "Updated Name"
        })
        
        expect(result.success).toBe(true)
        })

        it("should accept empty object", () => {
        const result = updateProductSchema.safeParse({})
        
        expect(result.success).toBe(true)
        })

        it("should accept null for categoryId (to unset)", () => {
        const result = updateProductSchema.safeParse({
            categoryId: null
        })
        
        expect(result.success).toBe(true)
        })

        it("should reject invalid price in update", () => {
        const result = updateProductSchema.safeParse({
            price: -50
        })
        
        expect(result.success).toBe(false)
        })
    })
})