import { Router } from "express";
import { getProductsController, createProductController, getProductByIdController, updateProductController, deleteProductController } from "./product.controller.js";
import { validate } from "../../shared/middleware/validate.js";
import { createProductSchema, updateProductSchema } from "./validation/product.validation.js";
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
 * 
 * STEP 7: Produk di assign ke user yang membuat
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
 * STEP 7: Ownership check di service layer
 * - ADMIN: boleh update semua
 * - SELLER: hanya produk miliknya
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
 * Accessible oleh: ADMIN, SELLER
 * 
 * STEP 7: Ownership check di service layer
 * - ADMIN: boleh delete semua
 * - SELLER: hanya produk miliknya
 */
router.delete(
    "/:id", 
    authenticate,
    authorize("ADMIN", "SELLER"),
    deleteProductController)

export default router
