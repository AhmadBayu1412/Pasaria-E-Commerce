// ============================================================
// CATEGORY RULES UNIT TESTS
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest"
import { CategoryRules } from "../../../modules/category/rules/category.rules.js"
import { BusinessError } from "../../../shared/errors/business.error.js"

// Mock Prisma
vi.mock("../../../infra/db/prisma", () => ({
    prisma: {
        category: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
        },
        product: {
            count: vi.fn()
        }
    }
}))

describe("CategoryRules", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("assertUniqueName", () => {
        it("should pass when category name does not exist", async () => {
            const { prisma } = await import("../../../infra/db/prisma.js")
            vi.mocked(prisma.category.findFirst).mockResolvedValue(null)

            await expect(CategoryRules.assertUniqueName("Electronics")).resolves.toBeUndefined()
        })

        it("should throw 409 when category name already exists (case insensitive)", async () => {
            const { prisma } = await import("../../../infra/db/prisma.js")
            vi.mocked(prisma.category.findFirst).mockResolvedValue({
                id: 1,
                name: "Electronics",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            await expect(CategoryRules.assertUniqueName("Electronics")).rejects.toThrow(BusinessError)
            await expect(CategoryRules.assertUniqueName("ELECTRONICS")).rejects.toThrow(BusinessError)
            await expect(CategoryRules.assertUniqueName("electronics")).rejects.toThrow(BusinessError)
        })
    })

    describe("assertUniqueNameForUpdate", () => {
        it("should pass when updating to same name (self)", async () => {
            const { prisma } = await import("../../../infra/db/prisma.js")
            vi.mocked(prisma.category.findFirst).mockResolvedValue({
                id: 1,
                name: "Electronics",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            await expect(CategoryRules.assertUniqueNameForUpdate(1, "Electronics")).resolves.toBeUndefined()
        })

        it("should throw 409 when name is taken by another category", async () => {
            const { prisma } = await import("../../../infra/db/prisma.js")
            vi.mocked(prisma.category.findFirst).mockResolvedValue({
                id: 2,
                name: "Fashion",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            await expect(CategoryRules.assertUniqueNameForUpdate(1, "Fashion")).rejects.toThrow(BusinessError)
        })
    })

    describe("assertCategoryExists", () => {
        it("should pass when category exists", async () => {
            const { prisma } = await import("../../../infra/db/prisma.js")
            vi.mocked(prisma.category.findUnique).mockResolvedValue({
                id: 1,
                name: "Electronics",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            await expect(CategoryRules.assertCategoryExists(1)).resolves.toBeUndefined()
        })

        it("should throw 404 when category does not exist", async () => {
            const { prisma } = await import("../../../infra/db/prisma.js")
            vi.mocked(prisma.category.findUnique).mockResolvedValue(null)

            await expect(CategoryRules.assertCategoryExists(999)).rejects.toThrow(BusinessError)
            try {
                await CategoryRules.assertCategoryExists(999)
            } catch (e) {
                expect((e as BusinessError).statusCode).toBe(404)
            }
        })
    })

    describe("assertCategoryNotInUse", () => {
        it("should pass when no products use the category", async () => {
            const { prisma } = await import("../../../infra/db/prisma.js")
            vi.mocked(prisma.product.count).mockResolvedValue(0)

            await expect(CategoryRules.assertCategoryNotInUse(1)).resolves.toBeUndefined()
        })

        it("should throw 409 when products use the category", async () => {
            const { prisma } = await import("../../../infra/db/prisma.js")
            vi.mocked(prisma.product.count).mockResolvedValue(5)

            await expect(CategoryRules.assertCategoryNotInUse(1)).rejects.toThrow(BusinessError)
            try {
                await CategoryRules.assertCategoryNotInUse(1)
            } catch (e) {
                expect((e as BusinessError).statusCode).toBe(409)
                expect((e as BusinessError).message).toContain("5 product(s)")
            }
        })
    })
})