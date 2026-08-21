import type { Request, Response, NextFunction } from "express"
import { getProductPricing, updatePricing } from "../services/pricing.service"
import type { AuthenticatedUser } from "../../../shared/session/session.types"
import { updatePricingSchema } from "../validation/pricing.validation"

function parseProductId(value: string | string[]): number | null {
  const str = Array.isArray(value) ? value[0] : value
  const id = parseInt(str, 10)
  return Number.isNaN(id) ? null : id
}

export async function getProductPricingController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = parseProductId(req.params.id)

    if (productId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid product ID",
        code: "INVALID_ID"
      })
      return
    }

    const pricing = await getProductPricing(productId)

    res.json({
      success: true,
      data: pricing
    })
  } catch (err) {
    next(err)
  }
}

export async function updatePricingController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = parseProductId(req.params.id)

    if (productId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid product ID",
        code: "INVALID_ID"
      })
      return
    }

    const validation = updatePricingSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Invalid request body",
        errors: validation.error.flatten()
      })
      return
    }

    const user = req.user as AuthenticatedUser
    const result = await updatePricing(
      productId,
      {
        basePrice: validation.data.basePrice,
        discountPrice: validation.data.discountPrice ?? null,
        reason: validation.data.reason
      },
      user
    )

    res.json(result)
  } catch (err) {
    next(err)
  }
}
