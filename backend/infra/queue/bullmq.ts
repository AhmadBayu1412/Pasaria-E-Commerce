/**
 * BullMQ Queue Instance
 * Singleton pattern for queue management
 */

import { Queue, ConnectionOptions } from "bullmq"
import { QUEUE_CONFIG } from "../../shared/queue/index.js"

let productQueue: Queue | null = null

/**
 * Create BullMQ connection options
 * Note: maxRetriesPerRequest MUST be null for BullMQ
 */
function createConnectionOptions(): ConnectionOptions {
  return {
    maxRetriesPerRequest: null
  }
}

/**
 * Get singleton Product Queue instance
 */
export function getProductQueue(): Queue {
  if (!productQueue) {
    productQueue = new Queue(QUEUE_CONFIG.QUEUE_NAME, {
      connection: createConnectionOptions(),

      defaultJobOptions: {
        attempts: QUEUE_CONFIG.RETRY.MAX_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: QUEUE_CONFIG.RETRY.INITIAL_DELAY
        },
        removeOnComplete: {
          count: QUEUE_CONFIG.JOB.REMOVE_ON_COMPLETE
        },
        removeOnFail: {
          count: QUEUE_CONFIG.JOB.REMOVE_ON_FAIL
        }
      }
    })

    console.log(`[QUEUE] Initialized: ${QUEUE_CONFIG.QUEUE_NAME}`)
  }

  return productQueue
}

/**
 * Close queue connection gracefully
 */
export async function closeQueue(): Promise<void> {
  if (productQueue) {
    await productQueue.close()
    productQueue = null
    console.log("[QUEUE] Closed")
  }
}

/**
 * Check if queue is ready
 */
export function isQueueReady(): boolean {
  return productQueue !== null && productQueue.isPaused !== undefined
}

/**
 * Get queue status for health checks
 */
export async function getQueueStatus(): Promise<{
  name: string
  isReady: boolean
  jobCounts: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
}> {
  const queue = getProductQueue()
  const counts = await queue.getJobCounts("waiting", "active", "completed", "failed")

  // Handle case where counts might not have all keys
  const jobCounts = {
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0
  }

  return {
    name: QUEUE_CONFIG.QUEUE_NAME,
    isReady: true,
    jobCounts
  }
}
