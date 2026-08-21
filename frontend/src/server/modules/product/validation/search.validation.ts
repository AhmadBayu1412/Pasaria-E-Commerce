import { z } from "zod"

const ALLOWED_SORT_FIELDS = ["name", "price", "createdAt", "effectivePrice"] as const
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const

export const searchProductsSchema = z.object({
  q: z.string().optional().default(""),

  page: z.coerce.number().int().positive().optional().default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20),

  sort: z.enum(ALLOWED_SORT_FIELDS).optional().default("createdAt"),

  order: z.enum(ALLOWED_SORT_ORDERS).optional().default("desc"),

  category: z.coerce.number().int().positive().optional(),

  seller: z.coerce.number().int().positive().optional(),

  minPrice: z.coerce.number().positive().optional(),

  maxPrice: z.coerce.number().positive().optional(),

  inStock: z.enum(["true", "false"]).optional()
})

export type SearchProductsInput = z.infer<typeof searchProductsSchema>

export const SEARCH_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  ALLOWED_SORT_FIELDS,
  ALLOWED_SORT_ORDERS
} as const
