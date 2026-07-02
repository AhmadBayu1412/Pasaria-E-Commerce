/**
 * Queue Configuration Constants
 */

const QUEUE_CONFIG_BASE = {
  // Queue name
  QUEUE_NAME: "product-queue",

  // Retry policy
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,      // 1 detik
    BACKOFF_MULTIPLIER: 2     // exponential: 1s, 2s, 4s
  },

  // Job lifecycle
  JOB: {
    TTL: 86400,              // 24 jam dalam detik
    REMOVE_ON_COMPLETE: 100, // Simpan 100 job selesai
    REMOVE_ON_FAIL: 500       // Simpan 500 job gagal
  },

  // Worker settings
  WORKER: {
    CONCURRENCY: 5,           // Max 5 job concurrently
    LIMITER_MAX: 10,          // Max 10 jobs
    LIMITER_DURATION: 1000    // per 1 detik
  }
} as const

// Freeze to ensure immutability at runtime
export const QUEUE_CONFIG = Object.freeze(QUEUE_CONFIG_BASE)

// Type exports
export type QueueName = typeof QUEUE_CONFIG.QUEUE_NAME
export type RetryConfig = typeof QUEUE_CONFIG.RETRY
export type WorkerConfig = typeof QUEUE_CONFIG.WORKER
