// modules/product/routes/product.routes.ts
// UPDATE: Tambahkan image routes

import { Router } from "express"
import {
  getProductsController,
  getProductByIdController,
  createProductController,
  updateProductController,
  deleteProductController,
  updateInventoryController
} from "../controllers/product.controller.js"
import {
  getProductImagesController,
  getImageByIdController,
  uploadImageController,
  deleteImageController,
  reorderImagesController,
  setPrimaryImageController
} from "../controllers/image.controller.js"
import { validate } from "../../../shared/middleware/validate.js"
import { createProductSchema, updateProductSchema } from "../validation/product.validation.js"
import { authenticate } from "../../auth/auth.middleware.js"
import { authorize } from "../../authorization/index.js"
import { upload } from "../../../shared/middleware/upload.js"

const router = Router()

// ============ PUBLIC ROUTES ============
// GET /products
// GET /products/:id
router.get("/", getProductsController)
router.get("/:id", getProductByIdController)

// ============ PRODUCT IMAGES - PUBLIC ============
// GET /products/:id/images
// GET /products/:id/images/:imageId
router.get("/:id/images", getProductImagesController)
router.get("/:id/images/:imageId", getImageByIdController)

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
router.patch("/:id/inventory", updateInventoryController)

// ============ PRODUCT IMAGES - PROTECTED ============
// POST /products/:id/images - Upload image
router.post(
  "/:id/images",
  authenticate,
  authorize("ADMIN", "SELLER"),
  upload.single("image"),
  uploadImageController
)

// DELETE /products/:id/images/:imageId - Delete image
router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("ADMIN", "SELLER"),
  deleteImageController
)

// PATCH /products/:id/images/reorder - Reorder images
router.patch(
  "/:id/images/reorder",
  authenticate,
  authorize("ADMIN", "SELLER"),
  reorderImagesController
)

// PATCH /products/:id/images/:imageId/primary - Set as primary
router.patch(
  "/:id/images/:imageId/primary",
  authenticate,
  authorize("ADMIN", "SELLER"),
  setPrimaryImageController
)

export default router