// ============================================================
// CATEGORY CONTROLLER - HTTP Handlers
// ============================================================

import { Request, Response, NextFunction } from "express"
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from "./category.service.js"

export async function getCategoriesController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const categories = await getCategories()
        return res.status(200).json({
            success: true,
            data: categories,
            count: Array.isArray(categories) ? categories.length : 0
        })
    } catch (err) {
        next(err)
    }
}

export async function getCategoryByIdController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
        const id = parseInt(idStr, 10)

        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            })
        }

        const category = await getCategoryById(id)

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            })
        }

        return res.json({
            success: true,
            data: category
        })
    } catch (err) {
        next(err)
    }
}

export async function createCategoryController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = req.user!
        const category = await createCategory(req.body, user)

        return res.status(201).json({
            success: true,
            data: category,
            message: "Category created successfully"
        })
    } catch (err) {
        next(err)
    }
}

export async function updateCategoryController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
        const id = parseInt(idStr, 10)

        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            })
        }

        const user = req.user!
        const category = await updateCategory(id, req.body, user)

        return res.json({
            success: true,
            data: category,
            message: "Category updated successfully"
        })
    } catch (err) {
        next(err)
    }
}

export async function deleteCategoryController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
        const id = parseInt(idStr, 10)

        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            })
        }

        const user = req.user!
        await deleteCategory(id, user)

        return res.json({
            success: true,
            message: "Category deleted successfully"
        })
    } catch (err) {
        next(err)
    }
}