import { prisma } from "../../../infra/db/prisma.js"
import { BusinessError } from "../../../shared/errors/business.error.js"
import { assertOwnership } from "./product.rules.js"
import { PRICING_CONFIG } from "../validation/pricing.validation.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"
import { Decimal } from "@prisma/client/runtime/library"

export function assertValidBasePrice(basePrice: number): void {
  if (basePrice <= 0) {
    throw new BusinessError(
      "Base price harus lebih dari 0",
      400,
      "PRICE_TOO_LOW"
    )
  }

  if (basePrice > PRICING_CONFIG.PRICE_MAX) {
    throw new BusinessError(
      `Base price terlalu tinggi. Maksimal ${PRICING_CONFIG.PRICE_MAX}`,
      400,
      "PRICE_TOO_HIGH"
    )
  }
}

export function assertValidDiscountPrice(
  discountPrice: number | null | undefined,
  basePrice: number
): void {
  if (discountPrice === null || discountPrice === undefined) {
    return
  }

  if (discountPrice < 0) {
    throw new BusinessError(
      "Discount price tidak boleh negatif",
      400,
      "DISCOUNT_NEGATIVE"
    )
  }

  if (discountPrice > basePrice) {
    throw new BusinessError(
      "Discount price tidak boleh melebihi base price",
      400,
      "DISCOUNT_EXCEEDS_BASE"
    )
  }
}

export function assertValidDecimalFormat(value: number): void {
  const str = String(value)
  const decimalIndex = str.indexOf(".")

  if (decimalIndex !== -1) {
    const decimals = str.slice(decimalIndex + 1).length
    if (decimals > PRICING_CONFIG.DECIMAL_PRECISION) {
      throw new BusinessError(
        `Harga maksimal ${PRICING_CONFIG.DECIMAL_PRECISION} angka di belakang koma`,
        400,
        "INVALID_DECIMAL_FORMAT"
      )
    }
  }
}

export function calculateEffectivePrice(
  basePrice: Decimal | string | number,
  discountPrice: Decimal | string | number | null
): number {
  const base = typeof basePrice === "number"
    ? basePrice
    : parseFloat(String(basePrice))

  if (discountPrice === null || discountPrice === undefined) {
    return base
  }

  const discount = typeof discountPrice === "number"
    ? discountPrice
    : parseFloat(String(discountPrice))

  return Math.min(base, discount)
}

export async function assertCanUpdatePricing(
  productId: number,
  user: AuthenticatedUser
): Promise<void> {
  await assertOwnership(productId, user)
}

export async function assertProductHasPricing(
  productId: number
): Promise<{
  basePrice: Decimal
  discountPrice: Decimal | null
  updatedAt: Date
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      basePrice: true,
      discountPrice: true,
      updatedAt: true
    }
  })

  if (!product) {
    throw new BusinessError(
      "Product tidak ditemukan",
      404,
      "PRODUCT_NOT_FOUND"
    )
  }

  return product
}
