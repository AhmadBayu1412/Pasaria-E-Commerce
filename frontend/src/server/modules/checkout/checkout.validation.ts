// ============================================================
// CHECKOUT VALIDATION (Zod Schemas)
// Phase 4 Step 5: Checkout Orchestration Foundation
//
// Note: POST /checkout has no request body in Step 5
// Authentication is handled by middleware (authenticate)
// Validation is minimal - just ensure request is well-formed
// ============================================================

import { z } from "zod"

// Step 5: No request body validation needed
// All data comes from authenticated user's cart

export const checkoutQuerySchema = z.object({})

export type CheckoutQueryInput = z.infer<typeof checkoutQuerySchema>

export const CheckoutValidationMessages = {
  UNAUTHORIZED: "Authentication required",
} as const
