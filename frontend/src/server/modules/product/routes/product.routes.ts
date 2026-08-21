// modules/product/routes/product.routes.ts
// UPDATE: Add search route

import { Router } from "express"
import {
  getProductsController,
  getProductByIdController,
  createProductController,
  updateProductController,
  deleteProductController,
  updateInventoryController
} from "../controllers/product.controller"
import {
  getProductImagesController,
  getImageByIdController,
  uploadImageController,
  deleteImageController,
  reorderImagesController,
  setPrimaryImageController
} from "../controllers/image.controller"
import {
  getProductPricingController,
  updatePricingController
} from "../controllers/pricing.controller"
import {
  searchProductsController
} from "../controllers/search.controller"
import { validate } from "../../../shared/middleware/validate"
import { createProductSchema, updateProductSchema } from "../validation/product.validation"
import { updatePricingSchema } from "../validation/pricing.validation"
import { authenticate } from "../../auth/auth.middleware"
import { authorize } from "../../authorization/index"
import { upload } from "../../../shared/middleware/upload"

const router = Router()

// ============ PUBLIC ROUTES ============
// GET /products (list all with pagination)
// IMPORTANT: /search must come BEFORE /:id to avoid "search" being matched as ID
router.get("/", getProductsController)

// ============ SEARCH ============
// GET /products/search
router.get("/search", searchProductsController)

// GET /products/:id
router.get("/:id", getProductByIdController)

// ============ PRODUCT IMAGES - PUBLIC ============
router.get("/:id/images", getProductImagesController)
router.get("/:id/images/:imageId", getImageByIdController)

// ============ PRICING - PUBLIC ============
router.get("/:id/pricing", getProductPricingController)

// ============ PROTECTED ROUTES ============
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "SELLER"),
  validate(createProductSchema),
  createProductController
)

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "SELLER"),
  validate(updateProductSchema),
  updateProductController
)

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "SELLER"),
  deleteProductController
)

router.patch("/:id/inventory", updateInventoryController)

// ============ PRODUCT IMAGES - PROTECTED ============
router.post(
  "/:id/images",
  authenticate,
  authorize("ADMIN", "SELLER"),
  upload.single("image"),
  uploadImageController
)

router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("ADMIN", "SELLER"),
  deleteImageController
)

router.patch(
  "/:id/images/reorder",
  authenticate,
  authorize("ADMIN", "SELLER"),
  reorderImagesController
)

router.patch(
  "/:id/images/:imageId/primary",
  authenticate,
  authorize("ADMIN", "SELLER"),
  setPrimaryImageController
)

// ============ PRICING - PROTECTED ============
router.patch(
  "/:id/pricing",
  authenticate,
  authorize("ADMIN", "SELLER"),
  validate(updatePricingSchema),
  updatePricingController
)

export default router
