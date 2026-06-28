// ============================================================
// PRODUCT CONTROLLER - Implementation
// HTTP concern only, no business logic
// ============================================================

import { Request, Response, NextFunction } from "express";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "./product.service.js";

// GET /products - semua orang bisa melihat
export async function getProductsController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const products = await getProducts()
        return res.status(200).json({
            success: true,
            data: products,
            count: Array.isArray(products) ? products.length : 0
        })
    } catch (err) {
        next(err)
    }
}

// GET /products/:id - Semua orang bisa melihat
export async function getProductByIdController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
        const id = parseInt(idStr, 10)
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" })
        }

        const data = await getProductById(id)
        if (!data) {
            return res.status(404).json({ success: false, message: "Produk tidak ditemukan" })
        }
        return res.json({ success: true, data })
    } catch (err) {
        next(err)
    }
}

// POST /products - Buat produk baru
/**
 * STEP 7 sellerId diambil dari req.user.id
 * User harus role ADMIN atau SELLER (sudah dicek authorize middleware)
 */
export async function createProductController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = req.user! // Sudah di set oleh authenticate middleware
        const product = await createProduct(req.body, user)
        return res.status(201).json({
            success: true,
            data: product,
            message: "Produk berhasil dibuat"
        })
    } catch (err) {
        next(err)
    }
}

// PUT /products/:id - Update produk
/**
 * STEP 7: Ownership check
 * - ADMIN: boleh update semua produk
 * - SELLER: hanya boleh update produk miliknya
 */
export async function updateProductController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
        const id = parseInt(idStr, 10)
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" })
        }

        const user = req.user! // Sudah di set oleh authenticate middleware
        const data = await updateProduct(id, req.body, user)

        return res.json({
            success: true,
            data,
            message: "Produk berhasil diperbarui"
        })
    } catch (err) {
        next(err)
    }
}

// DELETE /products/:id - Hapus produk
/**
 * STEP 7: Ownership check
 * - ADMIN: boleh delete semua produk
 * - SELLER: hanya boleh delete produk miliknya sendiri
 */
export async function deleteProductController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
        const id = parseInt(idStr, 10)
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" })
        }

        const user = req.user! // Sudah di set oleh authenticate middleware
        await deleteProduct(id, user)

        return res.json({ success: true, message: "Produk berhasil dihapus" })
    } catch (err) {
        next(err)
    }
}