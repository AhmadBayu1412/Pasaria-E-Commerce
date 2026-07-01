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
        productImage: {
            count: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            updateMany: vi.fn(),
            update: vi.fn(),
            aggregate: vi.fn()
        },
        audit: {
            create: vi.fn()
        }
    }
    return { prisma: mockFns }
})

describe("Image Rules", () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================
    // assertValidMimeType
    // ============================================================
    describe("assertValidMimeType", () => {
        it("should pass for allowed types", async () => {
            const { assertValidMimeType } = await import("../../../modules/product/rules/image.rules.js")

            expect(() => assertValidMimeType("image/jpeg")).not.toThrow()
            expect(() => assertValidMimeType("image/png")).not.toThrow()
            expect(() => assertValidMimeType("image/webp")).not.toThrow()
        })

        it("should throw for disallowed types", async () => {
            const { assertValidMimeType } = await import("../../../modules/product/rules/image.rules.js")

            expect(() => assertValidMimeType("image/gif"))
                .toThrow(BusinessError)
            expect(() => assertValidMimeType("application/pdf"))
                .toThrow(BusinessError)
        })

        it("should include allowed types in error message", async () => {
            const { assertValidMimeType } = await import("../../../modules/product/rules/image.rules.js")

            try {
                assertValidMimeType("image/gif")
            } catch (e) {
                expect((e as BusinessError).message).toContain("image/jpeg")
            }
        })
    })

    // ============================================================
    // assertValidFileSize
    // ============================================================
    describe("assertValidFileSize", () => {
        it("should pass for valid size", async () => {
            const { assertValidFileSize } = await import("../../../modules/product/rules/image.rules.js")

            expect(() => assertValidFileSize(1 * 1024 * 1024)).not.toThrow() // 1MB
            expect(() => assertValidFileSize(5 * 1024 * 1024)).not.toThrow() // 5MB exact
        })

        it("should throw for oversized file", async () => {
            const { assertValidFileSize } = await import("../../../modules/product/rules/image.rules.js")

            expect(() => assertValidFileSize(6 * 1024 * 1024)) // 6MB
                .toThrow(BusinessError)
        })

        it("should include 5MB limit in error message", async () => {
            const { assertValidFileSize } = await import("../../../modules/product/rules/image.rules.js")

            try {
                assertValidFileSize(10 * 1024 * 1024)
            } catch (e) {
                expect((e as BusinessError).message).toContain("5MB")
            }
        })
    })

    // ============================================================
    // assertCanAddImage
    // ============================================================
    describe("assertCanAddImage", () => {
        it("should pass when under max images", async () => {
            const { assertCanAddImage } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.productImage.count).mockResolvedValue(5)

            await expect(assertCanAddImage(1)).resolves.toBeUndefined()
        })

        it("should throw when at max images", async () => {
            const { assertCanAddImage } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.productImage.count).mockResolvedValue(10)

            await expect(assertCanAddImage(1))
                .rejects
                .toThrow(BusinessError)
        })

        it("should include MAX_IMAGES_EXCEEDED code", async () => {
            const { assertCanAddImage } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.productImage.count).mockResolvedValue(10)

            try {
                await assertCanAddImage(1)
            } catch (e) {
                expect((e as BusinessError).code).toBe("MAX_IMAGES_EXCEEDED")
            }
        })
    })

    // ============================================================
    // assertSinglePrimary
    // ============================================================
    describe("assertSinglePrimary", () => {
        it("should skip when newIsPrimary is false", async () => {
            const { assertSinglePrimary } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const updateMany = vi.mocked(prisma.productImage.updateMany)
            await assertSinglePrimary(1, false)
            expect(updateMany).not.toHaveBeenCalled()
        })

        it("should unset existing primaries when newIsPrimary is true", async () => {
            const { assertSinglePrimary } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.productImage.updateMany).mockResolvedValue({ count: 1 })
            await assertSinglePrimary(1, true)
            expect(prisma.productImage.updateMany).toHaveBeenCalledWith({
                where: { productId: 1, isPrimary: true },
                data: { isPrimary: false }
            })
        })
    })

    // ============================================================
    // assertImagesBelongToProduct
    // ============================================================
    describe("assertImagesBelongToProduct", () => {
        it("should pass when all images belong to product", async () => {
            const { assertImagesBelongToProduct } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.productImage.findMany).mockResolvedValue([
                { id: 1 },
                { id: 2 }
            ] as any)

            await expect(assertImagesBelongToProduct(1, [1, 2]))
                .resolves
                .toBeUndefined()
        })

        it("should throw when some images don't belong", async () => {
            const { assertImagesBelongToProduct } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.productImage.findMany).mockResolvedValue([
                { id: 1 }
            ] as any)

            await expect(assertImagesBelongToProduct(1, [1, 2, 3]))
                .rejects
                .toThrow(BusinessError)
        })
    })

    // ============================================================
    // assertImageOwnership
    // ============================================================
    describe("assertImageOwnership", () => {
        it("should return image for valid owner", async () => {
            const { assertImageOwnership } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const mockImage = { id: 1, productId: 1, isPrimary: false }
            const mockProduct = { id: 1, sellerId: 5 }

            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
            vi.mocked(prisma.productImage.findUnique).mockResolvedValue(mockImage as any)

            const sellerUser: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "test" }
            const result = await assertImageOwnership(1, 1, sellerUser)

            expect(result).toEqual(mockImage)
        })

        it("should throw for non-owner", async () => {
            const { assertImageOwnership } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const mockProduct = { id: 1, sellerId: 99 } // different owner

            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)

            const sellerUser: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "test" }

            await expect(assertImageOwnership(1, 1, sellerUser))
                .rejects
                .toThrow(BusinessError)
        })

        it("should throw for non-existent image", async () => {
            const { assertImageOwnership } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const mockProduct = { id: 1, sellerId: 5 }

            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
            vi.mocked(prisma.productImage.findUnique).mockResolvedValue(null)

            const sellerUser: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "test" }

            await expect(assertImageOwnership(1, 999, sellerUser))
                .rejects
                .toThrow(BusinessError)
        })

        it("should allow admin to bypass ownership", async () => {
            const { assertImageOwnership } = await import("../../../modules/product/rules/image.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const mockImage = { id: 1, productId: 1, isPrimary: false }

            vi.mocked(prisma.product.findUnique).mockResolvedValue(null) // admin bypasses this
            vi.mocked(prisma.productImage.findUnique).mockResolvedValue(mockImage as any)

            const adminUser: AuthenticatedUser = { id: 1, role: "ADMIN", sessionId: "admin" }
            const result = await assertImageOwnership(1, 1, adminUser)

            expect(result).toEqual(mockImage)
        })
    })
})
