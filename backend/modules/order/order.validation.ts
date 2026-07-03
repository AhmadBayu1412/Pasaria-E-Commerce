// ============================================================
// ORDER VALIDATION (Zod Schemas)
// Phase 4 Step 6: Order Draft Foundation
//
// Note: POST /orders/draft has no request body in Step 6
// Authentication is handled by middleware
// ============================================================

import { z } from "zod"

export const createDraftQuerySchema = z.object({})

export type CreateDraftQueryInput = z.infer<typeof createDraftQuerySchema>

export const OrderValidationMessages = {
  UNAUTHORIZED: "Authentication required",
} as const
