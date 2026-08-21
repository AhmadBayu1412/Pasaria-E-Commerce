/**
 * Queue Type Definitions
 * Zod schemas for type-safe job data
 */

import { z } from "zod"

// ============ PRODUCT REINDEX JOB ============
// Foundation job type for Step 9

export const ProductReindexJobSchema = z.object({
  type: z.literal("product_reindex"),
  productId: z.number().int().positive(),
  timestamp: z.number().int().positive().default(() => Date.now())
})

export type ProductReindexJob = z.infer<typeof ProductReindexJobSchema>

// ============ JOB TYPE UNION ============
// Extensible for future job types

export const QueueJobDataSchema = z.discriminatedUnion("type", [
  ProductReindexJobSchema
])

export type QueueJobData = z.infer<typeof QueueJobDataSchema>

// ============ VALIDATORS ============

export function isValidJob(data: unknown): data is QueueJobData {
  return QueueJobDataSchema.safeParse(data).success
}

export function parseJobData(data: unknown): QueueJobData {
  return QueueJobDataSchema.parse(data)
}

// ============ JOB RESULT TYPES ============

export interface JobResult {
  success: boolean
  jobId: string
  processedAt: string
  processingTimeMs?: number
}

export interface JobError {
  jobId: string
  error: string
  attempts: number
  failedAt: string
}
