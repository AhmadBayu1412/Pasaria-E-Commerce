// ============================================================
// BULLMQ CONFIGURATION
// Phase 4 Step 8: Checkout Queue
//
// Queue configuration for checkout background jobs
// ============================================================

import { Queue, Worker, ConnectionOptions } from "bullmq"
import { QUEUE_CONFIG } from "../../shared/queue/index.js"
import { CheckoutWorker } from "./checkout.worker.js"

let checkoutQueue: Queue | null = null
let checkoutWorker: Worker | null = null

// ============================================================
// QUEUE INITIALIZATION
// ============================================================

function createConnectionOptions(): ConnectionOptions {
  return {
    maxRetriesPerRequest: null,
  }
}

/**
 * Get singleton Checkout Queue instance
 */
export function getCheckoutQueue(): Queue {
  if (!checkoutQueue) {
    checkoutQueue = new Queue(QUEUE_CONFIG.QUEUE_NAME, {
      connection: createConnectionOptions(),

      defaultJobOptions: {
        attempts: QUEUE_CONFIG.RETRY.MAX_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: QUEUE_CONFIG.RETRY.INITIAL_DELAY,
        },
        removeOnComplete: {
          count: QUEUE_CONFIG.JOB.REMOVE_ON_COMPLETE,
        },
        removeOnFail: {
          count: QUEUE_CONFIG.JOB.REMOVE_ON_FAIL,
        },
      },
    })

    console.log(`[QUEUE] Initialized: ${QUEUE_CONFIG.QUEUE_NAME}`)
  }

  return checkoutQueue
}

/**
 * Initialize Checkout Worker
 *
 * Worker processes jobs from the checkout queue.
 * Includes graceful shutdown handling.
 */
export function initCheckoutWorker(): Worker {
  if (!checkoutWorker) {
    checkoutWorker = new Worker(
      QUEUE_CONFIG.QUEUE_NAME,
      CheckoutWorker.processJob,
      {
        connection: createConnectionOptions(),
        concurrency: QUEUE_CONFIG.WORKER.CONCURRENCY,
      }
    )

    // Event handlers
    checkoutWorker.on("completed", (job) => {
      console.log(`[WORKER] Job ${job.id} completed`)
    })

    checkoutWorker.on("failed", (job, err) => {
      console.error(`[WORKER] Job ${job?.id} failed:`, err)
    })

    checkoutWorker.on("error", (err) => {
      console.error(`[WORKER] Worker error:`, err)
    })

    console.log(
      `[WORKER] Checkout worker initialized (concurrency: ${QUEUE_CONFIG.WORKER.CONCURRENCY})`
    )
  }

  return checkoutWorker
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

export async function closeCheckoutWorker(): Promise<void> {
  if (checkoutWorker) {
    console.log("[WORKER] Closing checkout worker...")
    await checkoutWorker.close()
    checkoutWorker = null
    console.log("[WORKER] Checkout worker closed")
  }
}

export async function closeCheckoutQueue(): Promise<void> {
  if (checkoutQueue) {
    console.log("[QUEUE] Closing checkout queue...")
    await checkoutQueue.close()
    checkoutQueue = null
    console.log("[QUEUE] Checkout queue closed")
  }
}

/**
 * Graceful shutdown for both worker and queue
 */
export async function gracefulShutdown(): Promise<void> {
  console.log("[SHUTDOWN] Initiating graceful shutdown...")
  await closeCheckoutWorker()
  await closeCheckoutQueue()
  console.log("[SHUTDOWN] Graceful shutdown complete")
}

// ============================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================

/**
 * @deprecated Use getCheckoutQueue() instead
 */
export function getProductQueue(): Queue {
  return getCheckoutQueue()
}

/**
 * @deprecated Use closeCheckoutQueue() instead
 */
export async function closeQueue(): Promise<void> {
  return closeCheckoutQueue()
}
