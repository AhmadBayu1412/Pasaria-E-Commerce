// ============================================================
// GATEWAY CLIENT BASE
// Phase 5 Step 7: HTTP Client with Auth & Retry
//
// Philosophy:
// - Base class untuk semua gateway adapters
// - Handles: authentication, timeout, retry, error mapping
// - Extend this untuk Midtrans/Xendit implementations
// ============================================================

import { HttpClient, HttpClientError } from './http-client.js';
import { PaymentGatewayError } from '../gateways/gateway.errors.js';

export interface GatewayClientConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
}

export abstract class GatewayClient {
  protected readonly httpClient: HttpClient;
  protected readonly config: GatewayClientConfig;

  constructor(config: GatewayClientConfig) {
    this.config = config;

    this.httpClient = new HttpClient({
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs ?? 10_000,
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Execute request with retry policy
   * Retry-After dari provider diprioritaskan
   */
  protected async executeWithRetry<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: unknown,
  ): Promise<T> {
    let lastRetryAfterMs: number | undefined;

    for (
      let attempt = 0;
      attempt <= (this.config.maxRetries ?? 3);
      attempt++
    ) {
      try {
        const response = await this.httpClient.request<T>({
          method,
          path,
          body,
        });

        // Check HTTP status - throws if error
        this.throwIfError(response.status, response.data);

        // Success - return data
        return response.data as T;
      } catch (error) {
        // Extract Retry-After dari error jika ada
        if (error instanceof HttpClientError && error.retryAfterMs) {
          lastRetryAfterMs = error.retryAfterMs;
        }

        // Check if should retry
        if (!this.isRetryableError(error)) {
          throw this.mapToGatewayError(error);
        }

        // Check if should retry with delay
        if (attempt < (this.config.maxRetries ?? 3)) {
          const delay = this.calculateDelay(attempt, lastRetryAfterMs);
          await this.sleep(delay);
          continue;
        }

        // Max retries reached
        throw this.mapToGatewayError(error);
      }
    }

    // Should not reach here
    throw new Error('Unexpected retry loop exit');
  }

  /**
   * Calculate delay with Retry-After priority
   */
  private calculateDelay(attempt: number, retryAfterMs?: number): number {
    // Retry-After dari provider diprioritaskan
    if (retryAfterMs && retryAfterMs > 0) {
      return Math.min(retryAfterMs, 10_000); // Cap at 10s
    }

    // Exponential backoff sebagai fallback
    const baseDelay = 1_000;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, 10_000);

    // Add jitter (±25%)
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.floor(cappedDelay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected abstract getAuthHeaders(): Record<string, string>;
  protected abstract isRetryableError(error: unknown): boolean;
  protected abstract mapToGatewayError(error: unknown): PaymentGatewayError;
  protected abstract throwIfError(status: number, data: unknown): void;
}
