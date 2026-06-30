import { describe, it, expect, vi, beforeEach } from "vitest"
import { BusinessError } from "../../../shared/errors/business.error.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"

// Mock Prisma - factory function (hoisted by vitest)
vi.mock("../../../infra/db/prisma", () => {
    const mockFns = {
        product: {
            findUnique: vi.fn(),
            findFirst: vi.fn()
        },
        category: {
            findUnique: vi.fn()
        }
    }
    return { prisma: mockFns }
})

describe("ProductRules", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // Dynamic import untuk躲开 hoisting issue
    describe("assertOwnership", () => {
        it("should return null for ADMIN (bypass)", async () => {
            const { assertOwnership } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const adminUser: AuthenticatedUser = { id: 1, role: "ADMIN", sessionId: "admin-session" }

            const result = await assertOwnership(1, adminUser)

            expect(result).toBeNull()
            expect(prisma.product.findUnique).not.toHaveBeenCalled()
        })

        it("should return product for SELLER owner", async () => {
            const { assertOwnership } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const sellerUser: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "seller-session" }
            const mockProduct = { id: 1, sellerId: 5 }

            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)

            const result = await assertOwnership(1, sellerUser)

            expect(result).toEqual(mockProduct)
        })

        it("should throw 404 if product not found", async () => {
            const { assertOwnership } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const sellerUser: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "seller-session" }

            vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

            await expect(
                assertOwnership(999, sellerUser)
            ).rejects.toThrow(BusinessError)

            try {
                await assertOwnership(999, sellerUser)
            } catch (e) {
                expect((e as BusinessError).statusCode).toBe(404)
            }
        })

        it("should throw 403 if SELLER does not own product", async () => {
            const { assertOwnership } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const sellerUser: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "seller-session" }
            const mockProduct = { id: 1, sellerId: 99 } // different owner

            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)

            await expect(
                assertOwnership(1, sellerUser)
            ).rejects.toThrow(BusinessError)

            try {
                await assertOwnership(1, sellerUser)
            } catch (e) {
                expect((e as BusinessError).statusCode).toBe(403)
            }
        })
    })

    describe("assertUniqueName", () => {
        it("should not throw if name is unique", async () => {
            const { assertUniqueName } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.product.findFirst).mockResolvedValue(null)

            await expect(
                assertUniqueName("Unique Product")
            ).resolves.toBeUndefined()
        })

        it("should throw 409 if name exists", async () => {
            const { assertUniqueName } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.product.findFirst).mockResolvedValue({
                id: 1,
                name: "Existing",
                sellerId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                description: null,
                price: "100" as any,
                stock: 10,
                categoryId: null
            })

            await expect(
                assertUniqueName("Existing")
            ).rejects.toThrow(BusinessError)

            try {
                await assertUniqueName("Existing")
            } catch (e) {
                expect((e as BusinessError).statusCode).toBe(409)
            }
        })
    })

    describe("assertUniqueNameForUpdate", () => {
        it("should not throw if same product", async () => {
            const { assertUniqueNameForUpdate } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.product.findFirst).mockResolvedValue({
                id: 1,
                name: "Product",
                sellerId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                description: null,
                price: "100" as any,
                stock: 10,
                categoryId: null
            })

            await expect(
                assertUniqueNameForUpdate(1, "Product")
            ).resolves.toBeUndefined()
        })

        it("should throw 409 if different product has same name", async () => {
            const { assertUniqueNameForUpdate } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.product.findFirst).mockResolvedValue({
                id: 2,
                name: "Taken",
                sellerId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                description: null,
                price: "100" as any,
                stock: 10,
                categoryId: null
            })

            await expect(
                assertUniqueNameForUpdate(1, "Taken")
            ).rejects.toThrow(BusinessError)
        })
    })

    describe("assertCategoryExists", () => {
        it("should not throw if category exists", async () => {
            const { assertCategoryExists } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.category.findUnique).mockResolvedValue({
                id: 1,
                name: "Electronics",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            await expect(
                assertCategoryExists(1)
            ).resolves.toBeUndefined()
        })

        it("should throw 404 if category not found", async () => {
            const { assertCategoryExists } = await import("../../../modules/product/rules/product.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.category.findUnique).mockResolvedValue(null)

            await expect(
                assertCategoryExists(999)
            ).rejects.toThrow(BusinessError)
        })
    })
})
