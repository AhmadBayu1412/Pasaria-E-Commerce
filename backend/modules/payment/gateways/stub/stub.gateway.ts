// ============================================================
// STUB GATEWAY
// Phase 5 Step 4: Gateway Abstraction
// Phase 5 Step 8: Added getTransactionStatus()
//
// Philosophy:
// - Dummy implementation for development and testing
// - No HTTP calls, no network, no SDK
// - Always returns deterministic results
// - Configurable via constructor options
//
// Use Cases:
// 1. Development without credentials
// 2. Unit testing without mocking
// 3. Integration testing without network access
// 4. CI/CD environment
// ============================================================

import type {
  GatewayTransactionStatus,
  PaymentGateway,
} from '../gateway.interface.js';
import type { CreateChargeRequest, CreateChargeResult } from '../gateway.types.js';
import { PaymentGatewayError } from '../gateway.errors.js';

export interface StubGatewayOptions {
  shouldSucceed?: boolean;
  simulatedDelayMs?: number;
  stubTransactionStatus?: GatewayTransactionStatus;
}

export class StubGateway implements PaymentGateway {
  private readonly shouldSucceed: boolean;
  private readonly simulatedDelayMs: number;
  private readonly stubTransactionStatus: GatewayTransactionStatus;

  constructor(options: StubGatewayOptions = {}) {
    this.shouldSucceed = options.shouldSucceed ?? true;
    this.simulatedDelayMs = options.simulatedDelayMs ?? 0;
    // Default stub status - returns PENDING
    this.stubTransactionStatus = options.stubTransactionStatus ?? {
      transactionId: 'STUB_TXN_001',
      externalReference: '',
      status: 'PENDING',
      amount: 0,
      currency: 'IDR',
      updatedAt: new Date(),
    };
  }

  async createCharge(request: CreateChargeRequest): Promise<CreateChargeResult> {
    if (this.simulatedDelayMs > 0) {
      await this.delay(this.simulatedDelayMs);
    }

    if (!this.shouldSucceed) {
      throw PaymentGatewayError.providerError(
        'StubGateway: Simulated failure',
      );
    }

    const stubToken = `STUB_${Date.now()}_${request.paymentId}`;

    return {
      chargeStatus: 'CREATED',
      snapToken: stubToken,
      redirectUrl: `https://stub-gateway.pasaria.test/pay/${stubToken}`,
      externalReference: request.externalReference,
      metadata: {
        orderId: request.orderId,
        paymentId: request.paymentId,
        externalReference: request.externalReference,
      },
      createdAt: new Date(),
    };
  }

  async getTransactionStatus(externalReference: string): Promise<GatewayTransactionStatus> {
    if (this.simulatedDelayMs > 0) {
      await this.delay(this.simulatedDelayMs);
    }

    // Return a copy with the external reference set
    return {
      ...this.stubTransactionStatus,
      externalReference,
      updatedAt: new Date(),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
