import { Router } from "express"
import {
    getProductsController,
    getProductByIdController,
    createProductController,
    updateProductController,
    deleteProductController,
    updateInventoryController
} from "../controllers/product.controller.js"
import { validate } from "../../../shared/middleware/validate.js"
import { createProductSchema, updateProductSchema } from "../validation/product.validation.js"
import { authenticate } from "../../auth/auth.middleware.js"
import { authorize } from "../../authorization/index.js"

const router = Router()
 
// ============ PUBLIC ROUTES ============
// GET /products - dengan pagination
// GET /products/:id
router.get("/", getProductsController)
router.get("/:id", getProductByIdController)

// ============ PROTECTED ROUTES ============
// POST /products - Create new product
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "SELLER"),
    validate(createProductSchema),
    createProductController
    )

    // PUT /products/:id - Update product
    router.put(
    "/:id",
    authenticate,
    authorize("ADMIN", "SELLER"),
    validate(updateProductSchema),
    updateProductController
    )

    // DELETE /products/:id - Delete product
    router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "SELLER"),
    deleteProductController
)

// PATCH /products/:id/inventory - Inventory operations
router.patch(
    "/:id/inventory",
    updateInventoryController
)

export default router