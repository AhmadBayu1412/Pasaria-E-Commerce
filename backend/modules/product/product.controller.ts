import { Request, Response,NextFunction } from "express";
import { getProducts, createProduct, getProductById, updateProduct, deleteProduct } from "./product.service";

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
            data: products
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
            data: product
        })
    } catch (err) {
        next(err)
    }
}

// PUT /products/:id - Update produk 
/**
 * STEP 7: Ownership check
 * - ADMIN: boleh update semua produk
 * - SELLER:l hanya boleh update produk miliknya
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
            data
        })
    } catch (err) {
        next(err)
    }
}

// DELETE /products/:id - Hapus produk 
/**
 * STEP 7: Ownership check
 * - ADMIN: boleh delete semua produk
 * - SELLER:l hanya boleh delete produk miliknya sendiri
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
        const data = await deleteProduct(id, user)

        return res.json({ success: true, data })
    } catch (err) {
        next(err)
    }
}