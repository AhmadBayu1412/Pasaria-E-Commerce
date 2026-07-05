// ============================================================
// MIDTRANS GATEWAY
// Phase 5 Step 7: Main Adapter
//
// Philosophy:
// - Implements PaymentGateway interface
// - Compose: MidtransClient + MidtransMapper
// - No business logic - pure orchestration
// ============================================================

import type { PaymentGateway } from '../gateway.interface.js';
import type { CreateChargeRequest, CreateChargeResult } from '../gateway.types.js';
import { PaymentGatewayError } from '../gateway.errors.js';
import { MidtransClient } from './midtrans.client.js';
import { MidtransMapper } from './midtrans.mapper.js';

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
  async createCharge(request: CreateChargeRequest): Promise<CreateChargeResult> {
    try {
      // Translate domain request → Midtrans format
      const providerRequest = this.mapper.toProviderRequest(request);

      // Call Midtrans API
      const providerResponse = await this.client.createSnapToken(providerRequest);

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
}
