// ============================================================
// CATEGORY ROUTES
// ============================================================

import { Router } from "express"
import {
    getCategoriesController,
    getCategoryByIdController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
} from "./category.controller.js"
import { validate } from "../../shared/middleware/validate.js"
import { createCategorySchema, updateCategorySchema } from "./validation/category.validation.js"
import { authenticate } from "../auth/auth.middleware.js"
import { authorize } from "../authorization/index.js"

const router = Router()

// ============ PUBLIC ROUTES ============
// Semua orang bisa melihat kategori
router.get("/", getCategoriesController)
router.get("/:id", getCategoryByIdController)

// ============ PROTECTED ROUTES ============
// Hanya ADMIN yang boleh membuat kategori
router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    validate(createCategorySchema),
    createCategoryController
)

// Hanya ADMIN yang boleh mengupdate kategori
router.put(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate(updateCategorySchema),
    updateCategoryController
)

// Hanya ADMIN yang boleh menghapus kategori
router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    deleteCategoryController
)

export default router