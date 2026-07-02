/**
 * Queue Producer
 * Enqueues jobs to BullMQ after database transaction commits
 */

import { getProductQueue } from "./bullmq.js"
import type { ProductReindexJob } from "../../shared/queue/index.js"

/**
 * Enqueue product reindex job
 *
 * IMPORTANT: Call this AFTER database transaction commits
 * This function is fire-and-forget for the calling service
 *
 * @param productId - Product ID to reindex
 * @returns Job ID if successful, undefined if failed
 */
export async function queueProductReindex(productId: number): Promise<string | undefined> {
  const queue = getProductQueue()

  const jobData: ProductReindexJob = {
    type: "product_reindex",
    productId,
    timestamp: Date.now()
  }

  try {
    const job = await queue.add(
      jobData.type,
      jobData,
      {
        jobId: `reindex-${productId}-${Date.now()}`
      }
    )

    console.log(`[PRODUCER] Enqueued job ${job.id}: product_reindex product ${productId}`)

    return job.id

  } catch (error) {
    console.error(`[PRODUCER] Failed to enqueue reindex job for product ${productId}:`, error)
    return undefined
  }
}

/**
 * Get count of pending jobs in queue
 */
export async function getPendingJobCount(): Promise<number> {
  const queue = getProductQueue()
  const counts = await queue.getJobCounts("waiting", "active")
  return counts.waiting + counts.active
}

/**
 * Check if a specific job exists
 */
export async function hasJob(jobId: string): Promise<boolean> {
  const queue = getProductQueue()
  const job = await queue.getJob(jobId)
  return job !== null
}
