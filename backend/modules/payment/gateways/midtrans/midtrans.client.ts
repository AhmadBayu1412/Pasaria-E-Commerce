// ============================================================
// MIDTRANS CLIENT
// Phase 5 Step 7: HTTP Client for Midtrans API
//
// Philosophy:
// - Wraps GatewayClientBase with Midtrans-specific behavior
// - Handles: Basic Auth, error mapping
// - Base URL dari GatewayConfig, bukan hardcoded
// ============================================================

import { HttpClientError } from '../../client/http-client.js';
import { GatewayClient } from '../../client/gateway-client.js';
import { PaymentGatewayError } from '../gateway.errors.js';
import type {
  MidtransSnapResponse,
  MidtransTransactionStatus,
} from './midtrans.types.js';

export class MidtransClient extends GatewayClient {
  constructor(config: { apiKey: string; baseUrl: string; timeoutMs?: number; maxRetries?: number }) {
    super({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
    });
  }

  protected getAuthHeaders(): Record<string, string> {
    // Midtrans Basic Auth: base64(server_key:)
    const auth = Buffer.from(`${this.config.apiKey}:`).toString('base64');
    return { Authorization: `Basic ${auth}` };
  }

  protected isRetryableError(error: unknown): boolean {
    if (error instanceof HttpClientError) {
      return error.isRetryable;
    }
    return false;
  }

  protected mapToGatewayError(error: unknown): PaymentGatewayError {
    if (error && typeof error === 'object') {
      const err = error as { status?: number; message?: string };

      if (err.status === 401 || err.status === 403) {
        return PaymentGatewayError.authError(
          `Midtrans authentication failed: ${err.message}`,
          error,
        );
      }
      if (err.message?.includes('timeout')) {
        return PaymentGatewayError.timeoutError(
          `Midtrans request timeout: ${err.message}`,
          error,
        );
      }
      if (
        err.message?.includes('Network') ||
        err.message?.includes('ECONNREFUSED')
      ) {
        return PaymentGatewayError.networkError(
          `Midtrans network error: ${err.message}`,
          error,
        );
      }
      if (err.status && err.status >= 400 && err.status < 500) {
        return PaymentGatewayError.invalidRequest(
          `Midtrans invalid request: ${err.message}`,
        );
      }
      if (err.status && err.status >= 500) {
        return PaymentGatewayError.providerError(
          `Midtrans server error: ${err.message}`,
          error,
        );
      }
    }
    return PaymentGatewayError.providerError(
      `Unexpected Midtrans error: ${error}`,
      error,
    );
  }

  protected throwIfError(status: number, data: unknown): void {
    if (status >= 200 && status < 300) return;

    const errorData = data as {
      error_messages?: string[];
      status_message?: string;
    };
    const message =
      errorData?.error_messages?.join(', ') ||
      errorData?.status_message ||
      'Unknown error';

    const error: any = new Error(message);
    error.status = status;
    throw error;
  }

  async createSnapToken(request: object): Promise<MidtransSnapResponse> {
    return this.executeWithRetry<MidtransSnapResponse>(
      '/transactions',
      'POST',
      request,
    );
  }

  async getTransactionStatus(
    orderId: string,
  ): Promise<MidtransTransactionStatus> {
    return this.executeWithRetry<MidtransTransactionStatus>(
      `/${orderId}/status`,
      'GET',
    );
  }
}
