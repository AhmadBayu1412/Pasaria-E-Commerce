import type { Request, Response, NextFunction } from "express"
import { searchProducts } from "../services/search.service"
import { searchProductsSchema } from "../validation/search.validation"

export async function searchProductsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validation = searchProductsSchema.safeParse(req.query)

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Invalid search parameters",
        errors: validation.error.flatten()
      })
      return
    }

    const result = await searchProducts(validation.data)

    res.json(result)
  } catch (err) {
    next(err)
  }
}
