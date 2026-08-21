// ============================================================
// PRODUCT CONTROLLER
// HTTP concern only, no business logic
// ============================================================

import type { Request, Response, NextFunction } from "express"
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct, 
    deleteProduct
} from "../services/product.service"
import type { AuthenticatedUser } from "../../../shared/session/session.types"
import type { PaginationParamsDTO } from "../types/product.dto"
import { paginationQuerySchema } from "../validation/product.validation"
// Tambahkan import
import { inventoryOperationRequestSchema } from "../validation/product.validation"
import {
    getInventory,
    increaseStock,
    decreaseStock,
    reserveStock,
    releaseReserved
} from "../services/inventory.service"

/**
 * PATCH /products/:id/inventory
 * 
 * Inventory operations: increase, decrease, reserve, release
 * 
 * Request body:
 * {
 *   operation: "increase" | "decrease" | "reserve" | "release",
 *   quantity: number
 * }
 * 
 * Auth:
 * - increase/decrease: ADMIN atau SELLER (ownership check)
 * - reserve/release: PUBLIC (dipanggil oleh Cart service)
 */
export async function updateInventoryController(
    req: Request,
    res: Response,
    next: NextFunction
    ): Promise<void> {
    try {
        // 1. Parse product ID
        const productId = parseProductId(req.params.id)
        if (productId === null) {
        res.status(400).json({
            success: false,
            message: "Invalid product ID"
        })
        return
        }
        
        // 2. Validate request body
        const validation = inventoryOperationRequestSchema.safeParse(req.body)
        if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid request body",
            errors: validation.error.flatten()
        })
        return
        }
        
        const { operation, quantity } = validation.data
        
        // 3. Execute based on operation type
        switch (operation) {
        case "increase":
        case "decrease": {
            // Require authentication + ownership
            const user = req.user as AuthenticatedUser
            if (!user || user.role === "CUSTOMER") {
            res.status(403).json({
                success: false,
                message: "Hanya seller atau admin yang dapat mengubah stok"
            })
            return
            }
            
            const result = operation === "increase"
            ? await increaseStock(productId, quantity, user)
            : await decreaseStock(productId, quantity, user)
            
            const inventory = await getInventory(productId)
            
            res.json({
            success: true,
            data: inventory,
            message: operation === "increase"
                ? "Stok berhasil ditambahkan"
                : "Stok berhasil dikurangi"
            })
            break
        }
        
        case "reserve": {
            // No auth required (called by Cart)
            const result = await reserveStock(productId, quantity)
            
            res.json({
            success: true,
            data: {
                productId,
                reservedQuantity: result.reservedQuantity,
                remainingAvailable: result.remainingAvailable
            }
            })
            break
        }
        
        case "release": {
            // No auth required (called by Cart)
            const result = await releaseReserved(productId, quantity)
            
            res.json({
            success: true,
            data: {
                productId,
                releasedQuantity: quantity,
                reservedStockNow: result.remainingAvailable
            }
            })
            break
        }
        }
    } catch (err) {
        next(err)
    }
}

/**
 * GET /products
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sortBy: name | price | createdAt | stock (default: createdAt)
 * - sortOrder: asc | desc (default: desc)
 * 
 * Visibility:
 * - ADMIN: semua produk
 * - SELLER: produk miliknya
 * - CUSTOMER/PUBLIC: produk visible
 */
export async function getProductsController(
    req: Request,
    res: Response,
    next: NextFunction
    ): Promise<void> {
    try {
        const queryValidation = paginationQuerySchema.safeParse(req.query)
        
        if (!queryValidation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid query parameters",
            errors: queryValidation.error.flatten()
        })
        return
        }

        const params: PaginationParamsDTO = queryValidation.data
        const user = req.user as AuthenticatedUser | undefined
        
        const result = await getProducts(params, user)

        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
    }

    /**
     * GET /products/:id
     */
    export async function getProductByIdController(
    req: Request,
    res: Response,
    next: NextFunction
    ): Promise<void> {
    try {
        const id = parseProductId(req.params.id)

        if (id === null) {
        res.status(400).json({
            success: false,
            message: "Invalid ID"
        })
        return
        }

        const product = await getProductById(id)

        if (!product) {
        res.status(404).json({
            success: false,
            message: "Produk tidak ditemukan"
        })
        return
        }

        res.json({ success: true, data: product })
    } catch (err) {
        next(err)
    }
    }

    /**
     * POST /products
     */
    export async function createProductController(
    req: Request,
    res: Response,
    next: NextFunction
    ): Promise<void> {
    try {
        const user = req.user as AuthenticatedUser
        const product = await createProduct(req.body, user)

        res.status(201).json({
        success: true,
        data: product,
        message: "Produk berhasil dibuat"
        })
    } catch (err) {
        next(err)
    }
    }

    /**
     * PUT /products/:id
     */
    export async function updateProductController(
    req: Request,
    res: Response,
    next: NextFunction
    ): Promise<void> {
    try {
        const id = parseProductId(req.params.id)

        if (id === null) {
        res.status(400).json({
            success: false,
            message: "Invalid ID"
        })
        return
        }

        const user = req.user as AuthenticatedUser
        const product = await updateProduct(id, req.body, user)

        res.json({
        success: true,
        data: product,
        message: "Produk berhasil diperbarui"
        })
    } catch (err) {
        next(err)
    }
    }

    /**
     * DELETE /products/:id
     */
    export async function deleteProductController(
    req: Request,
    res: Response,
    next: NextFunction
    ): Promise<void> {
    try {
        const id = parseProductId(req.params.id)

        if (id === null) {
        res.status(400).json({
            success: false,
            message: "Invalid ID"
        })
        return
        }

        const user = req.user as AuthenticatedUser
        await deleteProduct(id, user)

        res.json({ success: true, message: "Produk berhasil dihapus" })
    } catch (err) {
        next(err)
    }
    }

    // ----- Helper -----
    function parseProductId(value: string | string[]): number | null {
    const str = Array.isArray(value) ? value[0] : value
    const id = parseInt(str, 10)
    return Number.isNaN(id) ? null : id
}