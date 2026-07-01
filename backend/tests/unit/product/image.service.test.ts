import { describe, it, expect, vi, beforeEach } from "vitest"
import { BusinessError } from "../../../shared/errors/business.error.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"

// Mock Prisma
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
            create: vi.fn(),
            aggregate: vi.fn(),
            delete: vi.fn()
        },
        audit: {
            create: vi.fn()
        },
        $transaction: vi.fn()
    }
    return { prisma: mockFns }
})

// Mock image.rules - includes assertOwnership
vi.mock("../../../modules/product/rules/image.rules.js", () => ({
    assertOwnership: vi.fn(),
    assertImageOwnership: vi.fn(),
    assertImageExists: vi.fn(),
    assertCanAddImage: vi.fn(),
    assertValidMimeType: vi.fn(),
    assertValidFileSize: vi.fn(),
    assertSinglePrimary: vi.fn(),
    assertImagesBelongToProduct: vi.fn()
}))

describe("Image Service", () => {

    const mockSeller: AuthenticatedUser = {
        id: 1,
        role: "SELLER" as const,
        sessionId: "seller-session"
    }

    const mockAdmin: AuthenticatedUser = {
        id: 2,
        role: "ADMIN" as const,
        sessionId: "admin-session"
    }

    const mockCustomer: AuthenticatedUser = {
        id: 3,
        role: "CUSTOMER" as const,
        sessionId: "customer-session"
    }

    const mockFile = {
        fieldname: "image",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        size: 1024 * 1024,
        buffer: Buffer.from("fake image data")
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("getProductImages", () => {
        it("should return empty list when no images", async () => {
            const { getProductImages } = await import("../../../modules/product/services/image.service.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.productImage.findMany).mockResolvedValue([])

            const result = await getProductImages(1)

            expect(result.success).toBe(true)
            expect(result.data).toEqual([])
            expect(result.totalImages).toBe(0)
            expect(result.primaryImage).toBeNull()
        })

        it("should return images sorted by position", async () => {
            const { getProductImages } = await import("../../../modules/product/services/image.service.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            const mockImages = [
                { id: 1, productId: 1, position: 0, isPrimary: false, createdAt: new Date(), path: "a", filename: "a.jpg", mimeType: "image/jpeg", size: 100, updatedAt: new Date() },
                { id: 2, productId: 1, position: 1, isPrimary: true, createdAt: new Date(), path: "b", filename: "b.jpg", mimeType: "image/jpeg", size: 100, updatedAt: new Date() }
            ]
            vi.mocked(prisma.productImage.findMany).mockResolvedValue(mockImages as any)

            const result = await getProductImages(1)

            expect(result.success).toBe(true)
            expect(result.data[0].position).toBe(0)
            expect(result.data[1].position).toBe(1)
            expect(result.primaryImage?.id).toBe(2)
        })
    })

    describe("uploadImage", () => {
        it("should upload image successfully", async () => {
            const { uploadImage } = await import("../../../modules/product/services/image.service.js")
            const { prisma } = await import("../../../infra/db/prisma.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertOwnership).mockResolvedValue(null as any)
            vi.mocked(prisma.productImage.count).mockResolvedValue(2)
            vi.mocked(prisma.productImage.aggregate).mockResolvedValue({ _max: { position: 1 } } as any)

            vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
                const tx = {
                    productImage: {
                        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                        create: vi.fn().mockResolvedValue({
                            id: 1,
                            productId: 1,
                            path: "uploads/products/1/test.jpg",
                            filename: "test.jpg",
                            mimeType: "image/jpeg",
                            size: 1024 * 1024,
                            position: 2,
                            isPrimary: false,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }),
                        aggregate: vi.fn().mockResolvedValue({ _max: { position: 1 } })
                    },
                    audit: { create: vi.fn().mockResolvedValue({ id: 1 }) }
                }
                return cb(tx)
            })

            const result = await uploadImage(1, mockFile as any, {}, mockSeller)

            expect(result.success).toBe(true)
            expect(result.data.productId).toBe(1)
            expect(result.data.filename).toBe("test.jpg")
        })

        it("should reject invalid mime type", async () => {
            const { uploadImage } = await import("../../../modules/product/services/image.service.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertOwnership).mockResolvedValue(null as any)
            vi.mocked(imageRules.assertValidMimeType).mockImplementation(() => {
                throw new BusinessError("Invalid file type", 400, "INVALID_FILE_TYPE")
            })

            const invalidFile = { ...mockFile, mimetype: "application/pdf" }

            await expect(uploadImage(1, invalidFile as any, {}, mockSeller))
                .rejects
                .toThrow(BusinessError)
        })

        it("should reject oversized file", async () => {
            const { uploadImage } = await import("../../../modules/product/services/image.service.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertOwnership).mockResolvedValue(null as any)
            vi.mocked(imageRules.assertValidMimeType).mockReturnValue(undefined)
            vi.mocked(imageRules.assertValidFileSize).mockImplementation(() => {
                throw new BusinessError("File too large", 400, "FILE_TOO_LARGE")
            })

            const largeFile = { ...mockFile, size: 10 * 1024 * 1024 }

            await expect(uploadImage(1, largeFile as any, {}, mockSeller))
                .rejects
                .toThrow(BusinessError)
        })

        it("should reject when max images reached", async () => {
            const { uploadImage } = await import("../../../modules/product/services/image.service.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertOwnership).mockResolvedValue(null as any)
            vi.mocked(imageRules.assertValidMimeType).mockReturnValue(undefined)
            vi.mocked(imageRules.assertValidFileSize).mockReturnValue(undefined)
            vi.mocked(imageRules.assertCanAddImage).mockImplementation(() => {
                throw new BusinessError("Max images exceeded", 400, "MAX_IMAGES_EXCEEDED")
            })

            await expect(uploadImage(1, mockFile as any, {}, mockSeller))
                .rejects
                .toThrow(BusinessError)
        })

        it("should reject non-owner seller", async () => {
            const { uploadImage } = await import("../../../modules/product/services/image.service.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertOwnership).mockImplementation(() => {
                throw new BusinessError("Not owner", 403, "NOT_OWNER")
            })

            await expect(uploadImage(1, mockFile as any, {}, mockSeller))
                .rejects
                .toThrow(BusinessError)
        })
    })

    describe("deleteImage", () => {
        it("should delete image successfully", async () => {
            const { deleteImage } = await import("../../../modules/product/services/image.service.js")
            const { prisma } = await import("../../../infra/db/prisma.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertImageOwnership).mockResolvedValue({
                id: 1, productId: 1, isPrimary: false, path: "uploads/test.jpg"
            } as any)
            vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
                const tx = {
                    productImage: { delete: vi.fn().mockResolvedValue({ id: 1 }) },
                    audit: { create: vi.fn().mockResolvedValue({}) }
                }
                return cb(tx)
            })

            const result = await deleteImage(1, 1, mockSeller)

            expect(result.success).toBe(true)
            expect(result.deletedId).toBe(1)
        })

        it("should reject non-owner", async () => {
            const { deleteImage } = await import("../../../modules/product/services/image.service.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertImageOwnership).mockImplementation(() => {
                throw new BusinessError("Not owner", 403, "NOT_OWNER")
            })

            await expect(deleteImage(1, 1, mockSeller))
                .rejects
                .toThrow(BusinessError)
        })
    })

    describe("reorderImages", () => {
        it("should reorder images successfully", async () => {
            const { reorderImages } = await import("../../../modules/product/services/image.service.js")
            const { prisma } = await import("../../../infra/db/prisma.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertOwnership).mockResolvedValue(null as any)
            vi.mocked(imageRules.assertImagesBelongToProduct).mockResolvedValue(undefined)
            vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
                const tx = {
                    productImage: {
                        update: vi.fn()
                            .mockResolvedValueOnce({ id: 2, position: 0, productId: 1, path: "b", filename: "b", mimeType: "image/jpeg", size: 100, isPrimary: false, createdAt: new Date(), updatedAt: new Date() })
                            .mockResolvedValueOnce({ id: 1, position: 1, productId: 1, path: "a", filename: "a", mimeType: "image/jpeg", size: 100, isPrimary: false, createdAt: new Date(), updatedAt: new Date() })
                    },
                    audit: { create: vi.fn().mockResolvedValue({}) }
                }
                return cb(tx)
            })

            const result = await reorderImages(1, [
                { imageId: 2, position: 0 },
                { imageId: 1, position: 1 }
            ], mockSeller)

            expect(result.success).toBe(true)
            expect(result.data.length).toBe(2)
        })

        it("should reject when image does not belong to product", async () => {
            const { reorderImages } = await import("../../../modules/product/services/image.service.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertOwnership).mockResolvedValue(null as any)
            vi.mocked(imageRules.assertImagesBelongToProduct).mockImplementation(() => {
                throw new BusinessError("Image not found", 404, "IMAGE_NOT_FOUND")
            })

            await expect(reorderImages(1, [
                { imageId: 1, position: 0 },
                { imageId: 999, position: 1 }
            ], mockSeller))
                .rejects
                .toThrow(BusinessError)
        })
    })

    describe("setPrimaryImage", () => {
        it("should set primary image successfully", async () => {
            const { setPrimaryImage } = await import("../../../modules/product/services/image.service.js")
            const { prisma } = await import("../../../infra/db/prisma.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertImageOwnership).mockResolvedValue({
                id: 1, productId: 1, isPrimary: false
            } as any)
            vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
                const tx = {
                    productImage: {
                        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                        update: vi.fn().mockResolvedValue({
                            id: 1, productId: 1, isPrimary: true, position: 0, path: "test",
                            filename: "test.jpg", mimeType: "image/jpeg", size: 100,
                            createdAt: new Date(), updatedAt: new Date()
                        })
                    },
                    audit: { create: vi.fn().mockResolvedValue({}) }
                }
                return cb(tx)
            })

            const result = await setPrimaryImage(1, 1, mockSeller)

            expect(result.success).toBe(true)
            expect(result.data.isPrimary).toBe(true)
        })

        it("should reject non-owner", async () => {
            const { setPrimaryImage } = await import("../../../modules/product/services/image.service.js")
            const imageRules = await import("../../../modules/product/rules/image.rules.js")

            vi.mocked(imageRules.assertImageOwnership).mockImplementation(() => {
                throw new BusinessError("Not owner", 403, "NOT_OWNER")
            })

            await expect(setPrimaryImage(1, 1, mockSeller))
                .rejects
                .toThrow(BusinessError)
        })
    })
})
