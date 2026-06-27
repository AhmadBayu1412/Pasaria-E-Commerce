import { Router } from "express";
import { getProductsController, createProductController, getProductByIdController, updateProductController, deleteProductController } from "./product.controller.js";
import { validate } from "../../shared/middleware/validate.js";
import { createProductSchema, updateProductSchema } from "../../shared/validation/product.validator.js";
import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../authorization/index.js";

const router = Router()

// ============ PUBLIC ROUTES ============
// Semua orang bisa melihat produk
router.get("/", getProductsController)
router.get("/:id", getProductByIdController)

// ============ PROTECTED ROUTES ============
/**
 * POST /products
 * Create new product
 * Accessible oleh: ADMIN, SELLER
 */
router.post(
    "/", 
    authenticate,
    authorize("ADMIN", "SELLER"),
    validate(createProductSchema), 
    createProductController)

/**
 * PUT /products/:id
 * Update product
 * Accessible oleh: ADMIN, SELLER
 * 
 * Note: Ownership check (seller hanya produ miliknya) -> Step 7
 * */

router.put(
    "/:id", 
    authenticate,
    authorize("ADMIN", "SELLER"),
    validate(updateProductSchema), 
    updateProductController)

/**
 * DELETE /products/:id
 * Delete product
 * Accessible oleh: ADMIN only
 */
router.delete(
    "/:id", 
    authenticate,
    authorize("ADMIN"),
    deleteProductController)

export default router
