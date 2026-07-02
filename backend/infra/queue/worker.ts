/**
 * BullMQ Worker
 * Processes jobs from the product queue
 */

import { Worker, Job } from "bullmq"
import { QUEUE_CONFIG } from "../../shared/queue/index.js"
import { handleProductReindex } from "./jobs/product.job.js"
import type { ProductReindexJob } from "../../shared/queue/index.js"

let productWorker: Worker | null = null

/**
 * Create and start the product worker
 */
export function createProductWorker(): Worker {
  if (productWorker) {
    console.log("[WORKER] Already running")
    return productWorker
  }

  productWorker = new Worker(
    QUEUE_CONFIG.QUEUE_NAME,
    async (job: Job) => {
      console.log(`[WORKER] Job ${job.id} (${job.name}) started`)
      console.log(`  Attempts: ${job.attemptsMade + 1}/${job.opts.attempts}`)

      switch (job.name) {
        case "product_reindex":
          await handleProductReindex(job as Job<ProductReindexJob>)
          break

        default:
          throw new Error(`Unknown job type: ${job.name}`)
      }
    },
    {
      connection: {
        maxRetriesPerRequest: null
      },
      concurrency: QUEUE_CONFIG.WORKER.CONCURRENCY
    }
  )

  // ============ EVENT HANDLERS ============

  productWorker.on("completed", (job: Job) => {
    console.log(`[WORKER] ✓ Job ${job.id} completed`)
  })

  productWorker.on("failed", (job: Job | undefined, err: Error) => {
    console.error(`[WORKER] ✗ Job ${job?.id} failed: ${err.message}`)
    if (job) {
      console.error(`  Attempts made: ${job.attemptsMade}/${job.opts.attempts}`)
    }
  })

  productWorker.on("error", (err: Error) => {
    console.error("[WORKER] Worker error:", err)
  })

  console.log(`[WORKER] Started (concurrency: ${QUEUE_CONFIG.WORKER.CONCURRENCY})`)

  return productWorker
}

/**
 * Stop the worker gracefully
 */
export async function closeWorker(): Promise<void> {
  if (productWorker) {
    await productWorker.close()
    productWorker = null
    console.log("[WORKER] Stopped")
  }
}

/**
 * Get worker status
 */
export function getWorkerStats(): {
  isRunning: boolean
} {
  return {
    isRunning: productWorker !== null
  }
}

/**
 * Pause worker (stop processing new jobs)
 */
export async function pauseWorker(): Promise<void> {
  if (productWorker) {
    await productWorker.pause()
    console.log("[WORKER] Paused")
  }
}

/**
 * Resume worker (resume processing)
 */
export async function resumeWorker(): Promise<void> {
  if (productWorker) {
    await productWorker.resume()
    console.log("[WORKER] Resumed")
  }
}
