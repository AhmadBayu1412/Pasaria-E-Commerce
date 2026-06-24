import { Router } from "express";
import { getProductsController, createProductController, getProductByIdController, updateProductController, deleteProductController } from "./product.controller";
import { validate } from "../../shared/middleware/validate";
import { createProductSchema, updateProductSchema } from "../../shared/validation/product.validator";

const router = Router()

router.get("/", getProductsController)
router.get("/:id", getProductByIdController)
router.post("/", validate(createProductSchema), createProductController)
router.put("/:id", validate(updateProductSchema), updateProductController)
router.delete("/:id", deleteProductController)

export default router
