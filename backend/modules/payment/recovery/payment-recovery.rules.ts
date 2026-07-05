// ============================================================
// PAYMENT RECOVERY RULES
// Phase 5 Step 8: Recovery Engine Configuration
//
// Philosophy:
// - Centralized configuration for recovery behavior
// - Environment-aware for runtime flexibility
// - Sensible defaults for production use
// ============================================================

// ----- Recovery Window -----

/**
 * Recovery Window (hours)
 * PENDING payments older than this are NOT recovered.
 *
 * Reason: Provider usually expires unpaid transactions after 24 hours.
 * No point in checking status for expired transactions.
 */
const DEFAULT_RECOVERY_WINDOW_HOURS = 24;

// ----- Batch Processing -----

/**
 * Batch Size
 * Number of payments to process per batch.
 *
 * Reason: Provider APIs have rate limits.
 * Processing in batches respects those limits.
 */
const DEFAULT_BATCH_SIZE = 100;

// ----- Rate Limiting -----

/**
 * Inter-Batch Delay (ms)
 * Delay between batches to respect provider rate limits.
 */
const INTER_BATCH_DELAY_MS = 1000; // 1 second

// ----- Retry Configuration -----

/**
 * Max Retries
 * Maximum retry attempts per payment on transient failures.
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * Retry Delay (ms)
 * Base delay between retries (with exponential backoff).
 */
const RETRY_DELAY_MS = 5000; // 5 seconds

// ----- Scheduler -----

/**
 * Schedule Interval (ms)
 * How often to run the recovery job (when used as scheduler).
 */
const SCHEDULE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Recovery Rules
 *
 * Centralized configuration for the recovery engine.
 *
 * These values can be:
 * - Hardcoded here (for simplicity)
 * - Loaded from config/env (for flexibility)
 * - Both (with env taking precedence)
 */
export const RecoveryRules = {
  /** Default configuration for production use */
  DEFAULT: {
    batchSize: DEFAULT_BATCH_SIZE,
    recoveryWindowHours: DEFAULT_RECOVERY_WINDOW_HOURS,
    maxRetries: DEFAULT_MAX_RETRIES,
    retryDelayMs: RETRY_DELAY_MS,
  },

  /** Inter-batch delay in milliseconds */
  INTER_BATCH_DELAY_MS,

  /** Schedule interval in milliseconds */
  SCHEDULE_INTERVAL_MS,

  /**
   * Get rules from environment
   * Allows runtime configuration via environment variables.
   *
   * Environment Variables:
   * - RECOVERY_BATCH_SIZE
   * - RECOVERY_WINDOW_HOURS
   * - RECOVERY_MAX_RETRIES
   * - RECOVERY_RETRY_DELAY_MS
   */
  fromEnv() {
    return {
      batchSize: parseInt(
        process.env['RECOVERY_BATCH_SIZE'] ?? String(DEFAULT_BATCH_SIZE),
        10,
      ),
      recoveryWindowHours: parseInt(
        process.env['RECOVERY_WINDOW_HOURS'] ??
          String(DEFAULT_RECOVERY_WINDOW_HOURS),
        10,
      ),
      maxRetries: parseInt(
        process.env['RECOVERY_MAX_RETRIES'] ?? String(DEFAULT_MAX_RETRIES),
        10,
      ),
      retryDelayMs: parseInt(
        process.env['RECOVERY_RETRY_DELAY_MS'] ?? String(RETRY_DELAY_MS),
        10,
      ),
    };
  },
} as const;

/**
 * Type for default recovery configuration
 */
export type RecoveryRulesDefault = typeof RecoveryRules.DEFAULT;
