// ============================================================
// CATEGORY ROUTES
// ============================================================

import { Router } from "express"
import { CategoryController } from "./category.controller.js"

const router = Router()

// ============ PUBLIC ROUTES ============
// Semua orang bisa melihat kategori
router.get("/", CategoryController.getCategories)
router.get("/:id", CategoryController.getCategoryById)

export default router
