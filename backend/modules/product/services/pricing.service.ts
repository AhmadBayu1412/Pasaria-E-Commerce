import { prisma } from "../../../infra/db/prisma.js"
import { TransactionManager } from "../../../shared/transaction/transaction.js"
import { CacheKey } from "../../../infra/cache/cache.helper.js"
import { Decimal } from "@prisma/client/runtime/library"
import {
  assertCanUpdatePricing,
  assertProductHasPricing,
  assertValidBasePrice,
  assertValidDiscountPrice,
  assertValidDecimalFormat,
  calculateEffectivePrice
} from "../rules/pricing.rules.js"
import type { AuthenticatedUser } from "../../../shared/session/session.types.js"
import type { PricingResponseDTO, PricingUpdateResponseDTO } from "../types/pricing.dto.js"

function normalizePricing(
  productId: number,
  basePrice: Decimal,
  discountPrice: Decimal | null,
  updatedAt: Date
): PricingResponseDTO {
  const base = parseFloat(String(basePrice))
  const discount = discountPrice ? parseFloat(String(discountPrice)) : null
  const effective = calculateEffectivePrice(basePrice, discountPrice)

  return {
    productId,
    basePrice: String(base),
    discountPrice: discount !== null ? String(discount) : null,
    effectivePrice: String(effective),
    currency: "IDR",
    hasDiscount: discount !== null,
    updatedAt: updatedAt.toISOString()
  }
}

export async function getProductPricing(
  productId: number
): Promise<PricingResponseDTO> {
  const product = await assertProductHasPricing(productId)

  return normalizePricing(
    productId,
    product.basePrice,
    product.discountPrice,
    product.updatedAt
  )
}

export async function updatePricing(
  productId: number,
  input: {
    basePrice: number
    discountPrice: number | null
    reason?: string
  },
  user: AuthenticatedUser
): Promise<PricingUpdateResponseDTO> {
  await assertCanUpdatePricing(productId, user)

  assertValidDecimalFormat(input.basePrice)
  assertValidBasePrice(input.basePrice)

  if (input.discountPrice !== null && input.discountPrice !== undefined) {
    assertValidDecimalFormat(input.discountPrice)
  }
  assertValidDiscountPrice(input.discountPrice, input.basePrice)

  const product = await TransactionManager.withTransaction(
    async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          basePrice: new Decimal(input.basePrice),
          discountPrice: input.discountPrice !== null
            ? new Decimal(input.discountPrice)
            : null,
          updatedAt: new Date()
        }
      })

      await tx.audit.create({
        data: {
          action: "UPDATE_PRODUCT_PRICING",
          entityType: "Product",
          entityId: productId,
          data: JSON.stringify({
            type: "UPDATE",
            productId,
            basePrice: input.basePrice,
            discountPrice: input.discountPrice,
            reason: input.reason,
            performedBy: user.id,
            role: user.role
          }),
          createdAt: new Date()
        }
      })

      return updated
    },
    [CacheKey.productsList, CacheKey.productDetail(productId)]
  )

  return {
    success: true,
    data: normalizePricing(
      productId,
      product.basePrice,
      product.discountPrice,
      product.updatedAt
    ),
    message: "Harga berhasil diperbarui"
  }
}
