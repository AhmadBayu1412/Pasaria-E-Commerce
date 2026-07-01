import { z } from "zod"

const PRICE_MAX = 999_999_999_999
const DECIMAL_PRECISION = 2

export const updatePricingSchema = z.object({
  basePrice: z.number({
    error: "Base price wajib diisi dan harus angka"
  })
    .positive("Base price harus lebih dari 0")
    .max(PRICE_MAX, `Base price maksimal ${PRICE_MAX}`)
    .refine((val) => {
      const str = String(val)
      const decimalIndex = str.indexOf(".")
      if (decimalIndex !== -1) {
        return str.slice(decimalIndex + 1).length <= DECIMAL_PRECISION
      }
      return true
    }, { message: `Base price maksimal ${DECIMAL_PRECISION} angka di belakang koma` }),

  discountPrice: z.number({
    error: "Discount price harus angka"
  })
    .nonnegative("Discount price tidak boleh negatif")
    .refine((val) => {
      const str = String(val)
      const decimalIndex = str.indexOf(".")
      if (decimalIndex !== -1) {
        return str.slice(decimalIndex + 1).length <= DECIMAL_PRECISION
      }
      return true
    }, { message: `Discount price maksimal ${DECIMAL_PRECISION} angka di belakang koma` })
    .optional()
    .nullable(),

  reason: z.string().max(500).optional()
})

export type UpdatePricingInput = z.infer<typeof updatePricingSchema>

export const PRICING_CONFIG = {
  PRICE_MIN: 0,
  PRICE_MAX,
  DECIMAL_PRECISION,
  CURRENCY: "IDR"
} as const
