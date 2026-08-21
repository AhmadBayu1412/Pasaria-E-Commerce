// ============================================================
// CART VALIDATION (Zod Schemas)
// Step 1: Structural validation only
// Business validation: Step 2+ (assertProductExists, etc.)
// ============================================================

import { z } from "zod"
import { BUSINESS_LIMITS } from "../../../shared/config/business.config"

// ----- Add To Cart Schema -----
export const addToCartSchema = z.object({
  productId: z.number()
    .int("Product ID must be an integer")
    .positive("Product ID must be positive"),

  quantity: z.number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(
      BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY,
      `Quantity cannot exceed ${BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY}`
    )
    .optional()
    .default(1),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>

// ----- Update Cart Item Schema -----
export const updateCartItemSchema = z.object({
  quantity: z.number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(
      BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY,
      `Quantity cannot exceed ${BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY}`
    ),
})

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>

// ----- Remove From Cart Schema -----
export const removeFromCartSchema = z.object({
  productId: z.number()
    .int("Product ID must be an integer")
    .positive("Product ID must be positive"),
})

export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>

// ----- Schema Helpers -----
export const CartValidationMessages = {
  PRODUCT_ID_REQUIRED: "Product ID is required",
  PRODUCT_ID_INVALID: "Product ID must be a positive integer",
  QUANTITY_REQUIRED: "Quantity is required",
  QUANTITY_INVALID: "Quantity must be a positive integer",
  QUANTITY_TOO_LOW: "Quantity must be at least 1",
  QUANTITY_TOO_HIGH: (max: number) => `Quantity cannot exceed ${max}`,
} as const
