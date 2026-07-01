import { describe, it, expect, vi, beforeEach } from "vitest"
import { BusinessError } from "../../../shared/errors/business.error.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"

vi.mock("../../../infra/db/prisma", () => {
    const mockFns = {
        product: {
            findUnique: vi.fn(),
            findFirst: vi.fn()
        }
    }
    return { prisma: mockFns }
})

vi.mock("../../../modules/product/rules/product.rules.js", () => ({
    assertOwnership: vi.fn()
}))

describe("Pricing Rules", () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("assertValidBasePrice", () => {
        it("should pass for positive price", async () => {
            const { assertValidBasePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidBasePrice(1000)).not.toThrow()
            expect(() => assertValidBasePrice(0.01)).not.toThrow()
        })

        it("should throw for zero", async () => {
            const { assertValidBasePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidBasePrice(0)).toThrow(BusinessError)
        })

        it("should throw for negative", async () => {
            const { assertValidBasePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidBasePrice(-100)).toThrow(BusinessError)
        })

        it("should throw for price exceeding max", async () => {
            const { assertValidBasePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidBasePrice(1_000_000_000_000)).toThrow(BusinessError)
        })

        it("should include PRICE_TOO_LOW code", async () => {
            const { assertValidBasePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            try {
                assertValidBasePrice(0)
            } catch (e) {
                expect((e as BusinessError).code).toBe("PRICE_TOO_LOW")
            }
        })

        it("should include PRICE_TOO_HIGH code", async () => {
            const { assertValidBasePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            try {
                assertValidBasePrice(1_000_000_000_000)
            } catch (e) {
                expect((e as BusinessError).code).toBe("PRICE_TOO_HIGH")
            }
        })
    })

    describe("assertValidDiscountPrice", () => {
        it("should pass for null discount", async () => {
            const { assertValidDiscountPrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDiscountPrice(null, 100000)).not.toThrow()
        })

        it("should pass for valid discount", async () => {
            const { assertValidDiscountPrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDiscountPrice(80000, 100000)).not.toThrow()
        })

        it("should pass for zero discount", async () => {
            const { assertValidDiscountPrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDiscountPrice(0, 100000)).not.toThrow()
        })

        it("should pass when discount equals base", async () => {
            const { assertValidDiscountPrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDiscountPrice(100000, 100000)).not.toThrow()
        })

        it("should throw for negative discount", async () => {
            const { assertValidDiscountPrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDiscountPrice(-1000, 100000)).toThrow(BusinessError)
        })

        it("should throw when discount exceeds base", async () => {
            const { assertValidDiscountPrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDiscountPrice(150000, 100000)).toThrow(BusinessError)
        })

        it("should include DISCOUNT_EXCEEDS_BASE code", async () => {
            const { assertValidDiscountPrice } = await import("../../../modules/product/rules/pricing.rules.js")
            try {
                assertValidDiscountPrice(150000, 100000)
            } catch (e) {
                expect((e as BusinessError).code).toBe("DISCOUNT_EXCEEDS_BASE")
            }
        })

        it("should include DISCOUNT_NEGATIVE code", async () => {
            const { assertValidDiscountPrice } = await import("../../../modules/product/rules/pricing.rules.js")
            try {
                assertValidDiscountPrice(-1000, 100000)
            } catch (e) {
                expect((e as BusinessError).code).toBe("DISCOUNT_NEGATIVE")
            }
        })
    })

    describe("assertValidDecimalFormat", () => {
        it("should pass for integer", async () => {
            const { assertValidDecimalFormat } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDecimalFormat(100000)).not.toThrow()
        })

        it("should pass for 1 decimal place", async () => {
            const { assertValidDecimalFormat } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDecimalFormat(100000.1)).not.toThrow()
        })

        it("should pass for 2 decimal places", async () => {
            const { assertValidDecimalFormat } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDecimalFormat(100000.99)).not.toThrow()
        })

        it("should throw for more than 2 decimal places", async () => {
            const { assertValidDecimalFormat } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(() => assertValidDecimalFormat(100000.999)).toThrow(BusinessError)
        })

        it("should include INVALID_DECIMAL_FORMAT code", async () => {
            const { assertValidDecimalFormat } = await import("../../../modules/product/rules/pricing.rules.js")
            try {
                assertValidDecimalFormat(100000.999)
            } catch (e) {
                expect((e as BusinessError).code).toBe("INVALID_DECIMAL_FORMAT")
            }
        })
    })

    describe("calculateEffectivePrice", () => {
        it("should return base price when no discount", async () => {
            const { calculateEffectivePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(calculateEffectivePrice(100000, null)).toBe(100000)
        })

        it("should return discount price when discount exists", async () => {
            const { calculateEffectivePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(calculateEffectivePrice(100000, 80000)).toBe(80000)
        })

        it("should handle string input", async () => {
            const { calculateEffectivePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(calculateEffectivePrice("100000", "80000")).toBe(80000)
        })

        it("should return base when discount is higher", async () => {
            const { calculateEffectivePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(calculateEffectivePrice(100000, 150000)).toBe(100000)
        })

        it("should return base when discount equals base", async () => {
            const { calculateEffectivePrice } = await import("../../../modules/product/rules/pricing.rules.js")
            expect(calculateEffectivePrice(100000, 100000)).toBe(100000)
        })
    })

    describe("assertCanUpdatePricing", () => {
        it("should call assertOwnership", async () => {
            const { assertCanUpdatePricing } = await import("../../../modules/product/rules/pricing.rules.js")
            const productRules = await import("../../../modules/product/rules/product.rules.js")

            const sellerUser: AuthenticatedUser = { id: 1, role: "SELLER", sessionId: "test" }

            vi.mocked(productRules.assertOwnership).mockResolvedValue(null as any)

            await assertCanUpdatePricing(1, sellerUser)

            expect(productRules.assertOwnership).toHaveBeenCalledWith(1, sellerUser)
        })
    })

    describe("assertProductHasPricing", () => {
        it("should return pricing data", async () => {
            const { assertProductHasPricing } = await import("../../../modules/product/rules/pricing.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.product.findUnique).mockResolvedValue({
                basePrice: { toString: () => "100000" },
                discountPrice: { toString: () => "80000" },
                updatedAt: new Date()
            } as any)

            const result = await assertProductHasPricing(1)

            expect(result.basePrice).toBeDefined()
            expect(result.discountPrice).toBeDefined()
        })

        it("should throw for non-existent product", async () => {
            const { assertProductHasPricing } = await import("../../../modules/product/rules/pricing.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

            await expect(assertProductHasPricing(999)).rejects.toThrow(BusinessError)
        })

        it("should include PRODUCT_NOT_FOUND code", async () => {
            const { assertProductHasPricing } = await import("../../../modules/product/rules/pricing.rules.js")
            const { prisma } = await import("../../../infra/db/prisma.js")

            vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

            try {
                await assertProductHasPricing(999)
            } catch (e) {
                expect((e as BusinessError).code).toBe("PRODUCT_NOT_FOUND")
            }
        })
    })
})
