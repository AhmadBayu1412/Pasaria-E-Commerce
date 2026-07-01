import { describe, it, expect, vi, beforeEach } from "vitest"
import { BusinessError } from "../../../shared/errors/business.error.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"

vi.mock("../../../infra/db/prisma", () => {
    const mockFns = {
        product: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn()
        },
        audit: {
            create: vi.fn()
        },
        $transaction: vi.fn()
    }
    return { prisma: mockFns }
})

vi.mock("../../../modules/product/rules/product.rules.js", () => ({
    assertOwnership: vi.fn()
}))

vi.mock("../../../modules/product/rules/pricing.rules.js", () => ({
    assertOwnership: vi.fn(),
    assertCanUpdatePricing: vi.fn(),
    assertProductHasPricing: vi.fn(),
    assertValidBasePrice: vi.fn(),
    assertValidDiscountPrice: vi.fn(),
    assertValidDecimalFormat: vi.fn(),
    calculateEffectivePrice: vi.fn()
}))

describe("Pricing Service", () => {

    const mockSeller: AuthenticatedUser = {
        id: 1,
        role: "SELLER",
        sessionId: "seller-session"
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("getProductPricing", () => {
        it("should return pricing data with discount", async () => {
            const { getProductPricing } = await import("../../../modules/product/services/pricing.service.js")
            const pricingRules = await import("../../../modules/product/rules/pricing.rules.js")

            vi.mocked(pricingRules.assertProductHasPricing).mockResolvedValue({
                basePrice: { toString: () => "120000" } as any,
                discountPrice: { toString: () => "100000" } as any,
                updatedAt: new Date("2025-01-15")
            })

            const result = await getProductPricing(1)

            expect(result.productId).toBe(1)
            expect(result.basePrice).toBe("120000")
            expect(result.discountPrice).toBe("100000")
            expect(result.currency).toBe("IDR")
            expect(result.hasDiscount).toBe(true)
        })

        it("should return pricing data without discount", async () => {
            const { getProductPricing } = await import("../../../modules/product/services/pricing.service.js")
            const pricingRules = await import("../../../modules/product/rules/pricing.rules.js")

            vi.mocked(pricingRules.assertProductHasPricing).mockResolvedValue({
                basePrice: { toString: () => "120000" } as any,
                discountPrice: null,
                updatedAt: new Date("2025-01-15")
            })

            const result = await getProductPricing(1)

            expect(result.basePrice).toBe("120000")
            expect(result.discountPrice).toBeNull()
            expect(result.hasDiscount).toBe(false)
        })

        it("should throw when product not found", async () => {
            const { getProductPricing } = await import("../../../modules/product/services/pricing.service.js")
            const pricingRules = await import("../../../modules/product/rules/pricing.rules.js")

            vi.mocked(pricingRules.assertProductHasPricing).mockRejectedValue(
                new BusinessError("Product not found", 404, "PRODUCT_NOT_FOUND")
            )

            await expect(getProductPricing(999)).rejects.toThrow(BusinessError)
        })
    })

    describe("updatePricing", () => {
        it("should update pricing successfully", async () => {
            const { updatePricing } = await import("../../../modules/product/services/pricing.service.js")
            const pricingRules = await import("../../../modules/product/rules/pricing.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(pricingRules.assertCanUpdatePricing).mockResolvedValue(undefined)
            vi.mocked(pricingRules.assertValidDecimalFormat).mockReturnValue(undefined)
            vi.mocked(pricingRules.assertValidBasePrice).mockReturnValue(undefined)
            vi.mocked(pricingRules.assertValidDiscountPrice).mockReturnValue(undefined)

            vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
                const tx = {
                    product: {
                        update: vi.fn().mockResolvedValue({
                            id: 1,
                            basePrice: { toString: () => "120000" } as any,
                            discountPrice: { toString: () => "100000" } as any,
                            updatedAt: new Date()
                        })
                    },
                    audit: { create: vi.fn().mockResolvedValue({}) }
                }
                return cb(tx)
            })

            const result = await updatePricing(1, {
                basePrice: 120000,
                discountPrice: 100000,
                reason: "New year sale"
            }, mockSeller)

            expect(result.success).toBe(true)
            expect(result.data.basePrice).toBe("120000")
            expect(result.data.discountPrice).toBe("100000")
            expect(result.message).toBe("Harga berhasil diperbarui")
        })

        it("should allow removing discount with null", async () => {
            const { updatePricing } = await import("../../../modules/product/services/pricing.service.js")
            const pricingRules = await import("../../../modules/product/rules/pricing.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(pricingRules.assertCanUpdatePricing).mockResolvedValue(undefined)
            vi.mocked(pricingRules.assertValidDecimalFormat).mockReturnValue(undefined)
            vi.mocked(pricingRules.assertValidBasePrice).mockReturnValue(undefined)
            vi.mocked(pricingRules.assertValidDiscountPrice).mockReturnValue(undefined)

            vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
                const tx = {
                    product: {
                        update: vi.fn().mockResolvedValue({
                            id: 1,
                            basePrice: { toString: () => "120000" } as any,
                            discountPrice: null,
                            updatedAt: new Date()
                        })
                    },
                    audit: { create: vi.fn().mockResolvedValue({}) }
                }
                return cb(tx)
            })

            const result = await updatePricing(1, {
                basePrice: 120000,
                discountPrice: null
            }, mockSeller)

            expect(result.success).toBe(true)
            expect(result.data.discountPrice).toBeNull()
            expect(result.data.hasDiscount).toBe(false)
        })

        it("should reject when not owner", async () => {
            const { updatePricing } = await import("../../../modules/product/services/pricing.service.js")
            const pricingRules = await import("../../../modules/product/rules/pricing.rules.js")

            vi.mocked(pricingRules.assertCanUpdatePricing).mockRejectedValue(
                new BusinessError("Not owner", 403, "NOT_OWNER")
            )

            await expect(updatePricing(1, {
                basePrice: 120000,
                discountPrice: 100000
            }, mockSeller)).rejects.toThrow(BusinessError)
        })

        it("should reject invalid base price", async () => {
            const { updatePricing } = await import("../../../modules/product/services/pricing.service.js")
            const pricingRules = await import("../../../modules/product/rules/pricing.rules.js")

            vi.mocked(pricingRules.assertCanUpdatePricing).mockResolvedValue(undefined)
            vi.mocked(pricingRules.assertValidDecimalFormat).mockReturnValue(undefined)
            vi.mocked(pricingRules.assertValidBasePrice).mockImplementation(() => {
                throw new BusinessError("Invalid base price", 400, "PRICE_TOO_LOW")
            })

            await expect(updatePricing(1, {
                basePrice: 0,
                discountPrice: null
            }, mockSeller)).rejects.toThrow(BusinessError)
        })

        it("should reject discount exceeding base", async () => {
            const { updatePricing } = await import("../../../modules/product/services/pricing.service.js")
            const pricingRules = await import("../../../modules/product/rules/pricing.rules.js")

            vi.mocked(pricingRules.assertCanUpdatePricing).mockResolvedValue(undefined)
            vi.mocked(pricingRules.assertValidDecimalFormat).mockReturnValue(undefined)
            vi.mocked(pricingRules.assertValidBasePrice).mockReturnValue(undefined)
            vi.mocked(pricingRules.assertValidDiscountPrice).mockImplementation(() => {
                throw new BusinessError("Discount exceeds base", 400, "DISCOUNT_EXCEEDS_BASE")
            })

            await expect(updatePricing(1, {
                basePrice: 100000,
                discountPrice: 150000
            }, mockSeller)).rejects.toThrow(BusinessError)
        })

        it("should update with base price only", async () => {
            const { updatePricing } = await import("../../../modules/product/services/pricing.service.js")
            const pricingRules = await import("../../../modules/product/rules/pricing.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(pricingRules.assertCanUpdatePricing).mockResolvedValue(undefined)
            vi.mocked(pricingRules.assertValidDecimalFormat).mockReturnValue(undefined)
            vi.mocked(pricingRules.assertValidBasePrice).mockReturnValue(undefined)
            vi.mocked(pricingRules.assertValidDiscountPrice).mockReturnValue(undefined)

            vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
                const tx = {
                    product: {
                        update: vi.fn().mockResolvedValue({
                            id: 1,
                            basePrice: { toString: () => "150000" } as any,
                            discountPrice: null,
                            updatedAt: new Date()
                        })
                    },
                    audit: { create: vi.fn().mockResolvedValue({}) }
                }
                return cb(tx)
            })

            const result = await updatePricing(1, {
                basePrice: 150000,
                discountPrice: null
            }, mockSeller)

            expect(result.success).toBe(true)
            expect(result.data.basePrice).toBe("150000")
        })
    })
})
