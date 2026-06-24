import { Request, Response,NextFunction } from "express";
import { getProducts, createProduct, getProductById, updateProduct, deleteProduct } from "./product.service";

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

export async function createProductController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const product = await createProduct(req.body)
        return res.status(201).json({
            success: true,
            data: product
        })
    } catch (err) {
        next(err)
    }
}

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

        const data = await updateProduct(id, req.body)

        return res.json({
            success: true,
            data
        })
    } catch (err) {
        next(err)
    }
}
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

        const data = await deleteProduct(id)

        return res.json({ success: true, data })
    } catch (err) {
        next(err)
    }
}