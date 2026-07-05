// ============================================================
// MIDTRANS GATEWAY
// Phase 5 Step 7: Main Adapter
// Phase 5 Step 8: Extended with getTransactionStatus()
//
// Philosophy:
// - Implements PaymentGateway interface
// - Compose: MidtransClient + MidtransMapper
// - No business logic - pure orchestration
// ============================================================

import type {
  GatewayTransactionStatus,
  GatewayStatus,
  PaymentGateway,
} from '../gateway.interface.js';
import type { CreateChargeRequest, CreateChargeResult } from '../gateway.types.js';
import { PaymentGatewayError } from '../gateway.errors.js';
import { MidtransClient } from './midtrans.client.js';
import { MidtransMapper } from './midtrans.mapper.js';
import type { MidtransTransactionStatus } from './midtrans.types.js';

export interface MidtransGatewayConfig {
  readonly serverKey: string;
  readonly clientKey?: string;
  readonly baseUrl: string;
  readonly isProduction?: boolean;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
}

export class MidtransGateway implements PaymentGateway {
  private readonly client: MidtransClient;
  private readonly mapper: MidtransMapper;

  constructor(config: MidtransGatewayConfig) {
    if (!config.serverKey) {
      throw new Error('Midtrans server key is required');
    }

    this.client = new MidtransClient({
      apiKey: config.serverKey,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs ?? 10_000,
      maxRetries: config.maxRetries ?? 3,
    });

    this.mapper = new MidtransMapper();
  }

  /**
   * Create Charge via Midtrans Snap API
   */
  async createCharge(
    request: CreateChargeRequest,
  ): Promise<CreateChargeResult> {
    try {
      // Translate domain request → Midtrans format
      const providerRequest = this.mapper.toProviderRequest(request);

      // Call Midtrans API
      const providerResponse =
        await this.client.createSnapToken(providerRequest);

      // Translate response → domain result
      return this.mapper.toDomainResult(providerResponse, request);
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      throw PaymentGatewayError.providerError(
        `Midtrans charge failed: ${error}`,
        error,
      );
    }
  }

  /**
   * Get Transaction Status from Midtrans
   * Phase 5 Step 8: Added for Recovery Engine
   *
   * Uses Midtrans Status API to get current transaction status.
   * https://docs.midtrans.com/reference/get-transaction-status
   */
  async getTransactionStatus(
    externalReference: string,
  ): Promise<GatewayTransactionStatus> {
    try {
      // Call Midtrans Status API
      const providerStatus = await this.client.getTransactionStatus(
        externalReference,
      );

      // Map to domain status
      return this.mapTransactionStatus(providerStatus);
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      throw PaymentGatewayError.providerError(
        `Failed to get transaction status: ${error}`,
        error,
      );
    }
  }

  /**
   * Map Midtrans Status to Domain GatewayStatus
   *
   * Midtrans transaction_status values:
   * https://docs.midtrans.com/reference/transaction-status
   */
  private mapTransactionStatus(
    status: MidtransTransactionStatus,
  ): GatewayTransactionStatus {
    // Status mapping: Midtrans → Domain
    const statusMap: Record<string, GatewayStatus> = {
      capture: 'SUCCESS', // Card payment captured
      settlement: 'SUCCESS', // Payment confirmed
      pending: 'PENDING', // Waiting for payment
      deny: 'FAILED', // Payment denied
      cancel: 'CANCELLED', // Payment cancelled
      expire: 'EXPIRED', // Payment expired
      refund: 'FAILED', // Payment refunded (treat as failure for our system)
    };

    const gatewayStatus: GatewayStatus =
      statusMap[status.transaction_status] ?? 'PENDING';

    return {
      transactionId: status.transaction_id,
      externalReference: status.order_id,
      status: gatewayStatus,
      amount: parseInt(status.gross_amount, 10),
      currency: status.currency,
      paidAt:
        status.transaction_status === 'settlement' ||
        status.transaction_status === 'capture'
          ? new Date()
          : undefined,
      updatedAt: new Date(),
    };
  }
}
