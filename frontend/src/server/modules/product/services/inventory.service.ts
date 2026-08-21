// ============================================================
// INVENTORY SERVICE
// Inventory operations: increase, decrease, reserve, release
// ============================================================

import { prisma } from "../../../infra/db/prisma"
import { CacheKey } from "../../../infra/cache/cache.helper"
import { deleteCache } from "../../../infra/cache/redis.service"
import { TransactionManager } from "../../../shared/transaction/transaction"
import { BusinessError } from "../../../shared/errors/business.error"
import type { AuthenticatedUser } from "../../../shared/session/session.types"
import {
    assertOwnership,
    assertCanDecrease,
    assertCanReserve,
    assertCanRelease
    } from "../rules/product.rules"
    import type {
    StockAdjustmentResult,
    ReservationResult
} from "../types/product.types"
import type {
    InventoryResponseDTO
} from "../types/product.dto"

// ----- Normalize Inventory for Response -----
function normalizeInventory(product: any): InventoryResponseDTO {
    const availableStock = product.availableStock ?? 0
    const reservedStock = product.reservedStock ?? 0
    
    return {
        productId: product.id,
        availableStock,
        reservedStock,
        totalStock: availableStock + reservedStock,
        updatedAt: product.updatedAt instanceof Date
        ? product.updatedAt.toISOString()
        : new Date(product.updatedAt).toISOString()
    }
}

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * GET INVENTORY
 * 
 * Retrieve inventory state for a single product.
 * Used by: Seller dashboard, public product detail
 */
export async function getInventory(productId: number): Promise<InventoryResponseDTO | null> {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
        id: true,
        availableStock: true,
        reservedStock: true,
        updatedAt: true
        }
    })
    
    if (!product) {
        return null
    }
    
    return normalizeInventory(product)
}

// ============================================================
// WRITE OPERATIONS
// ============================================================

/**
 * INCREASE STOCK
 * 
 * Tambahkan stok tersedia (availableStock += quantity).
 * Dipakai saat: Restock, barang return (tanpa reservation context).
 * 
 * Aturan:
 * - Only seller/owner yang boleh mengubah
 * - Quantity harus > 0
 */
export async function increaseStock(
    productId: number,
    quantity: number,
    user: AuthenticatedUser
    ): Promise<StockAdjustmentResult> {
    // 1. Ownership check
    await assertOwnership(productId, user)
    
    // 2. Validate quantity
    if (quantity < 1) {
        throw new BusinessError("Quantity harus lebih dari 0", 400, "INVALID_QUANTITY")
    }
    
    // 3. Execute in transaction
    const product = await TransactionManager.withTransaction(
        async (tx) => {
        return await tx.product.update({
            where: { id: productId },
            data: {
            availableStock: {
                increment: quantity
            }
            },
            select: {
            id: true,
            availableStock: true,
            reservedStock: true,
            updatedAt: true
            }
        })
        },
        [CacheKey.productsList, CacheKey.productDetail(productId)]
    )
    
    return {
        productId: product.id,
        previousAvailable: product.availableStock - quantity,
        newAvailable: product.availableStock
    }
}

/**
 * DECREASE STOCK
 * 
 * Kurangi stok tersedia (availableStock -= quantity).
 * Dipakai saat: Stock correction, write-off, dll.
 * 
 * Aturan:
 * - availableStock tidak boleh negatif setelah decrease
 * - Ownership check
 */
export async function decreaseStock(
    productId: number,
    quantity: number,
    user: AuthenticatedUser
): Promise<StockAdjustmentResult> {
  // 1. Ownership check + available stock validation
    const existing = await assertCanDecrease(productId, quantity)
    
    // 2. Execute in transaction
    const product = await TransactionManager.withTransaction(
        async (tx) => {
        return await tx.product.update({
            where: { id: productId },
            data: {
            availableStock: {
                decrement: quantity
            }
            },
            select: {
            id: true,
            availableStock: true,
            reservedStock: true,
            updatedAt: true
            }
        })
        },
        [CacheKey.productsList, CacheKey.productDetail(productId)]
    )
    
    return {
        productId: product.id,
        previousAvailable: existing.availableStock,
        newAvailable: product.availableStock
    }
}

/**
 * RESERVE STOCK
 * 
 * Pindahkan dari available → reserved (availableStock -= qty, reservedStock += qty).
 * Dipakai oleh: Cart service (Phase 4) saat customer menambahkan ke cart.
 * 
 * Aturan:
 * - availableStock harus >= quantity
 * - reservedStock bertambah
 * - TIDAK ada ownership check (cart/checkout adalah customer action)
 * - TIDAK ada reason/audit trail (belum ada inventory history)
 */
export async function reserveStock(
    productId: number,
    quantity: number
    ): Promise<ReservationResult> {
    // 1. Validate stock availability
    const existing = await assertCanReserve(productId, quantity)
    
    // 2. Execute atomic operation
    await TransactionManager.withTransaction(
        async (tx) => {
        await tx.product.update({
            where: { id: productId },
            data: {
            availableStock: { decrement: quantity },
            reservedStock: { increment: quantity }
            }
        })
        },
        [CacheKey.productDetail(productId)]
    )
    
    return {
        success: true,
        productId,
        reservedQuantity: quantity,
        remainingAvailable: existing.availableStock - quantity
    }
}

/**
 * RELEASE RESERVED STOCK
 * 
 * Kembalikan dari reserved → available (reservedStock -= qty, availableStock += qty).
 * Dipakai oleh: Cart service saat cart expired atau customer remove item.
 * 
 * Aturan:
 * - reservedStock harus >= quantity
 * - TIDAK ada ownership check
 * - TIDAK ada reason/audit trail
 */
export async function releaseReserved(
    productId: number,
    quantity: number
    ): Promise<ReservationResult> {
    // 1. Validate reserved stock availability
    const existing = await assertCanRelease(productId, quantity)
    
    // 2. Execute atomic operation
    await TransactionManager.withTransaction(
        async (tx) => {
        await tx.product.update({
            where: { id: productId },
            data: {
            availableStock: { increment: quantity },
            reservedStock: { decrement: quantity }
            }
        })
        },
        [CacheKey.productDetail(productId)]
    )
    
    return {
        success: true,
        productId,
        reservedQuantity: -quantity,
        remainingAvailable: existing.reservedStock - quantity
    }
}