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
} from "../services/product.service.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"
import type { PaginationParamsDTO } from "../types/product.dto.js"
import { paginationQuerySchema } from "../validation/product.validation.js"

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