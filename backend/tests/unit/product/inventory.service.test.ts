// ============================================================
// INVENTORY SERVICE UNIT TESTS
// Phase 3 Step 4 - Inventory Foundation
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest"
import { BusinessError } from "../../../shared/errors/business.error.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"

// Mock dependencies
vi.mock("../../../infra/db/prisma", () => {
    const mockFns = {
        product: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn()
        },
        category: {
            findUnique: vi.fn()
        }
    }
    return { prisma: mockFns }
})

vi.mock("../../../shared/transaction/transaction.js", () => ({
    TransactionManager: {
        withTransaction: vi.fn(async (operations) => {
            return await operations({})
        })
    }
}))

describe("InventoryService", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================
    // GROUP A: Inventory Rules Validation
    // ============================================================
    describe("Inventory Rules Validation", () => {
        describe("assertPositiveQuantity", () => {
            it("should accept positive quantity", async () => {
                const { assertPositiveQuantity } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )

                expect(() => assertPositiveQuantity(1)).not.toThrow()
                expect(() => assertPositiveQuantity(100)).not.toThrow()
            })

            it("should reject zero quantity", async () => {
                const { assertPositiveQuantity } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )

                expect(() => assertPositiveQuantity(0)).toThrow(BusinessError)
                try {
                    assertPositiveQuantity(0)
                } catch (e) {
                    expect((e as BusinessError).code).toBe("INVALID_QUANTITY")
                }
            })

            it("should reject negative quantity", async () => {
                const { assertPositiveQuantity } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )

                expect(() => assertPositiveQuantity(-1)).toThrow(BusinessError)
                expect(() => assertPositiveQuantity(-100)).toThrow(BusinessError)
            })
        })

        describe("assertCanReserve", () => {
            it("should return product when available stock is sufficient", async () => {
                const { assertCanReserve } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )
                const { prisma } = await import("../../../infra/db/prisma.js")

                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: 10,
                    reservedStock: 0
                } as any)

                const result = await assertCanReserve(1, 5)
                expect(result.id).toBe(1)
                expect(result.availableStock).toBe(10)
            })

            it("should throw INSUFFICIENT_STOCK when available stock is not enough", async () => {
                const { assertCanReserve } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )
                const { prisma } = await import("../../../infra/db/prisma.js")

                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: 3,
                    reservedStock: 0
                } as any)

                await expect(assertCanReserve(1, 5)).rejects.toThrow(BusinessError)
                try {
                    await assertCanReserve(1, 5)
                } catch (e) {
                    expect((e as BusinessError).code).toBe("INSUFFICIENT_STOCK")
                }
            })

            it("should throw PRODUCT_NOT_FOUND when product does not exist", async () => {
                const { assertCanReserve } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )
                const { prisma } = await import("../../../infra/db/prisma.js")

                vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

                await expect(assertCanReserve(999, 5)).rejects.toThrow(BusinessError)
                try {
                    await assertCanReserve(999, 5)
                } catch (e) {
                    expect((e as BusinessError).code).toBe("PRODUCT_NOT_FOUND")
                }
            })
        })

        describe("assertCanRelease", () => {
            it("should return product when reserved stock is sufficient", async () => {
                const { assertCanRelease } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )
                const { prisma } = await import("../../../infra/db/prisma.js")

                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    reservedStock: 10
                } as any)

                const result = await assertCanRelease(1, 5)
                expect(result.id).toBe(1)
                expect(result.reservedStock).toBe(10)
            })

            it("should throw INSUFFICIENT_RESERVED_STOCK when reserved is not enough", async () => {
                const { assertCanRelease } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )
                const { prisma } = await import("../../../infra/db/prisma.js")

                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    reservedStock: 2
                } as any)

                await expect(assertCanRelease(1, 5)).rejects.toThrow(BusinessError)
                try {
                    await assertCanRelease(1, 5)
                } catch (e) {
                    expect((e as BusinessError).code).toBe("INSUFFICIENT_RESERVED_STOCK")
                }
            })

            it("should throw PRODUCT_NOT_FOUND when product does not exist", async () => {
                const { assertCanRelease } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )
                const { prisma } = await import("../../../infra/db/prisma.js")

                vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

                await expect(assertCanRelease(999, 5)).rejects.toThrow(BusinessError)
            })
        })

        describe("assertCanDecrease", () => {
            it("should return product when available stock is sufficient", async () => {
                const { assertCanDecrease } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )
                const { prisma } = await import("../../../infra/db/prisma.js")

                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: 100
                } as any)

                const result = await assertCanDecrease(1, 50)
                expect(result.id).toBe(1)
                expect(result.availableStock).toBe(100)
            })

            it("should throw INSUFFICIENT_AVAILABLE_STOCK when stock is not enough", async () => {
                const { assertCanDecrease } = await import(
                    "../../../modules/product/rules/product.rules.js"
                )
                const { prisma } = await import("../../../infra/db/prisma.js")

                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: 5
                } as any)

                await expect(assertCanDecrease(1, 10)).rejects.toThrow(BusinessError)
                try {
                    await assertCanDecrease(1, 10)
                } catch (e) {
                    expect((e as BusinessError).code).toBe("INSUFFICIENT_AVAILABLE_STOCK")
                }
            })
        })
    })

    // ============================================================
    // GROUP B: Inventory Operations
    // ============================================================
    describe("Inventory Operations", () => {
        describe("increaseStock", () => {
            it("should increase available stock successfully", async () => {
                const { increaseStock } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )
                const { TransactionManager } = await import(
                    "../../../shared/transaction/transaction.js"
                )

                const mockUpdated = {
                    id: 1,
                    availableStock: 150,
                    reservedStock: 0,
                    updatedAt: new Date()
                }

                vi.mocked(TransactionManager.withTransaction).mockResolvedValue(mockUpdated)

                const seller: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "test" }

                // Mock ownership check
                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    sellerId: 5
                } as any)

                const result = await increaseStock(1, 50, seller)

                expect(result.productId).toBe(1)
                expect(result.previousAvailable).toBe(100)
                expect(result.newAvailable).toBe(150)
            })

            it("should throw 403 when non-owner tries to increase", async () => {
                const { increaseStock } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )

                const seller: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "test" }
                const otherSeller: AuthenticatedUser = { id: 99, role: "SELLER", sessionId: "other" }

                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    sellerId: 5
                } as any)

                await expect(increaseStock(1, 50, otherSeller)).rejects.toThrow(BusinessError)
                try {
                    await increaseStock(1, 50, otherSeller)
                } catch (e) {
                    expect((e as BusinessError).statusCode).toBe(403)
                }
            })

            it("should throw INVALID_QUANTITY for zero quantity", async () => {
                const { increaseStock } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )

                const seller: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "test" }

                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    sellerId: 5
                } as any)

                await expect(increaseStock(1, 0, seller)).rejects.toThrow(BusinessError)
                try {
                    await increaseStock(1, 0, seller)
                } catch (e) {
                    expect((e as BusinessError).code).toBe("INVALID_QUANTITY")
                }
            })
        })

        describe("decreaseStock", () => {
            it("should decrease available stock successfully", async () => {
                const { decreaseStock } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )
                const { TransactionManager } = await import(
                    "../../../shared/transaction/transaction.js"
                )

                const mockUpdated = {
                    id: 1,
                    availableStock: 50,
                    reservedStock: 0,
                    updatedAt: new Date()
                }

                vi.mocked(TransactionManager.withTransaction).mockResolvedValue(mockUpdated)

                const seller: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "test" }

                // Mock assertCanDecrease
                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: 100,
                    reservedStock: 0
                } as any)

                const result = await decreaseStock(1, 50, seller)

                expect(result.productId).toBe(1)
                expect(result.previousAvailable).toBe(100)
                expect(result.newAvailable).toBe(50)
            })

            it("should throw when available stock is insufficient", async () => {
                const { decreaseStock } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )

                const seller: AuthenticatedUser = { id: 5, role: "SELLER", sessionId: "test" }

                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: 5,
                    reservedStock: 0
                } as any)

                await expect(decreaseStock(1, 100, seller)).rejects.toThrow(BusinessError)
            })
        })

        describe("reserveStock", () => {
            it("should reserve stock successfully", async () => {
                const { reserveStock } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )
                const { TransactionManager } = await import(
                    "../../../shared/transaction/transaction.js"
                )

                vi.mocked(TransactionManager.withTransaction).mockResolvedValue(undefined)

                // Mock assertCanReserve
                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: 100,
                    reservedStock: 0
                } as any)

                const result = await reserveStock(1, 5)

                expect(result.success).toBe(true)
                expect(result.productId).toBe(1)
                expect(result.reservedQuantity).toBe(5)
                expect(result.remainingAvailable).toBe(95)
            })

            it("should throw when available stock is insufficient", async () => {
                const { reserveStock } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )

                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: 3,
                    reservedStock: 0
                } as any)

                await expect(reserveStock(1, 10)).rejects.toThrow(BusinessError)
                try {
                    await reserveStock(1, 10)
                } catch (e) {
                    expect((e as BusinessError).code).toBe("INSUFFICIENT_STOCK")
                }
            })

            it("should throw PRODUCT_NOT_FOUND when product does not exist", async () => {
                const { reserveStock } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )

                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

                await expect(reserveStock(999, 5)).rejects.toThrow(BusinessError)
            })
        })

        describe("releaseReserved", () => {
            it("should release reserved stock successfully", async () => {
                const { releaseReserved } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )
                const { TransactionManager } = await import(
                    "../../../shared/transaction/transaction.js"
                )

                vi.mocked(TransactionManager.withTransaction).mockResolvedValue(undefined)

                // Mock assertCanRelease
                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    reservedStock: 10
                } as any)

                const result = await releaseReserved(1, 5)

                expect(result.success).toBe(true)
                expect(result.productId).toBe(1)
            })

            it("should throw when reserved stock is insufficient", async () => {
                const { releaseReserved } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )

                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    reservedStock: 2
                } as any)

                await expect(releaseReserved(1, 5)).rejects.toThrow(BusinessError)
                try {
                    await releaseReserved(1, 5)
                } catch (e) {
                    expect((e as BusinessError).code).toBe("INSUFFICIENT_RESERVED_STOCK")
                }
            })
        })

        describe("getInventory", () => {
            it("should return inventory state for existing product", async () => {
                const { getInventory } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )

                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: 100,
                    reservedStock: 25,
                    updatedAt: new Date("2026-06-30T12:00:00Z")
                } as any)

                const result = await getInventory(1)

                expect(result).not.toBeNull()
                expect(result!.productId).toBe(1)
                expect(result!.availableStock).toBe(100)
                expect(result!.reservedStock).toBe(25)
                expect(result!.totalStock).toBe(125)
                expect(result!.updatedAt).toBe("2026-06-30T12:00:00.000Z")
            })

            it("should return null for non-existing product", async () => {
                const { getInventory } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )

                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

                const result = await getInventory(999)
                expect(result).toBeNull()
            })

            it("should handle null values with defaults", async () => {
                const { getInventory } = await import(
                    "../../../modules/product/services/inventory.service.js"
                )

                const { prisma } = await import("../../../infra/db/prisma.js")
                vi.mocked(prisma.product.findUnique).mockResolvedValue({
                    id: 1,
                    availableStock: null as any,
                    reservedStock: null as any,
                    updatedAt: new Date()
                } as any)

                const result = await getInventory(1)

                expect(result!.availableStock).toBe(0)
                expect(result!.reservedStock).toBe(0)
                expect(result!.totalStock).toBe(0)
            })
        })
    })

    // ============================================================
    // GROUP C: Inventory Validation Schema
    // ============================================================
    describe("Inventory Validation Schema", () => {
        it("should accept valid increase operation", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "increase",
                quantity: 50
            })

            expect(result.success).toBe(true)
        })

        it("should accept valid decrease operation", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "decrease",
                quantity: 10
            })

            expect(result.success).toBe(true)
        })

        it("should accept valid reserve operation", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "reserve",
                quantity: 3
            })

            expect(result.success).toBe(true)
        })

        it("should accept valid release operation", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "release",
                quantity: 2
            })

            expect(result.success).toBe(true)
        })

        it("should reject invalid operation type", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "invalid",
                quantity: 5
            })

            expect(result.success).toBe(false)
        })

        it("should reject quantity less than 1", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "increase",
                quantity: 0
            })

            expect(result.success).toBe(false)
        })

        it("should reject negative quantity", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "increase",
                quantity: -5
            })

            expect(result.success).toBe(false)
        })

        it("should reject quantity greater than 10000", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "increase",
                quantity: 10001
            })

            expect(result.success).toBe(false)
        })

        it("should reject non-integer quantity", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "increase",
                quantity: 5.5
            })

            expect(result.success).toBe(false)
        })

        it("should accept quantity at maximum boundary (10000)", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "increase",
                quantity: 10000
            })

            expect(result.success).toBe(true)
        })

        it("should accept quantity at minimum boundary (1)", async () => {
            const { inventoryOperationRequestSchema } = await import(
                "../../../modules/product/validation/product.validation.js"
            )

            const result = inventoryOperationRequestSchema.safeParse({
                operation: "increase",
                quantity: 1
            })

            expect(result.success).toBe(true)
        })
    })
})
