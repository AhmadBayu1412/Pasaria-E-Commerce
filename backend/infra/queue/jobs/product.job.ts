/**
 * Product Job Handlers
 * Contains business logic for product-related background jobs
 */

import type { Job } from "bullmq"
import type { ProductReindexJob } from "../../../shared/queue/index.js"

/**
 * Handle product_reindex job
 *
 * Responsibilities:
 * - Re-index product in search engine
 * - Update search cache
 * - Notify downstream services
 *
 * TODO: Will integrate with search.service.ts when search is finalized
 */
export async function handleProductReindex(job: Job<ProductReindexJob>): Promise<void> {
  const { productId, timestamp } = job.data

  console.log(`[HANDLER] Processing product_reindex`)
  console.log(`  Product ID: ${productId}`)
  console.log(`  Queued at: ${new Date(timestamp).toISOString()}`)
  console.log(`  Attempt: ${job.attemptsMade + 1}/${job.opts.attempts}`)

  const startTime = Date.now()

  try {
    // TODO: Integration with search service
    // await searchService.reindexProduct(productId)

    // Simulate work for now (remove when real implementation exists)
    await simulateReindexWork(productId)

    const duration = Date.now() - startTime
    console.log(`[HANDLER] Completed product_reindex for product ${productId} in ${duration}ms`)

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[HANDLER] Failed product_reindex for product ${productId} after ${duration}ms:`, error)
    throw error
  }
}

/**
 * Simulate reindex work
 * REMOVE when real search service integration exists
 */
async function simulateReindexWork(productId: number): Promise<void> {
  // Simulate async work (e.g., Elasticsearch indexing)
  await new Promise(resolve => setTimeout(resolve, 100))
  console.log(`[HANDLER] (simulated) Reindexed product ${productId}`)
}
