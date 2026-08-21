// ============================================================
// PAYMENT APPLICATION SERVICE (Orchestrator)
// Phase 5 Step 5: Idempotency Layer Integration
//
// Naming Note:
// - "Handler" used for consistency with project conventions
// - Alternative name: PaymentOrchestrator or PaymentApplicationService
// - This is NOT an HTTP handler, but a Use Case orchestrator
//
// Philosophy:
// - Application Layer - orchestrates Domain and Integration
// - Combines PaymentIntentService + GatewayChargeService + IdempotencyService
// - This is the actual "Use Case" that controller calls
//
// DI Pattern:
// - Gateway injected via constructor (from GatewayFactory at bootstrap)
// - IdempotencyService is singleton (uses database)
//
// IMPORTANT:
// - This class ONLY orchestrates flow
// - NO business rules (they belong in PaymentIntentService)
// - NO translation (they belong in GatewayChargeService)
// - NO idempotency logic (they belong in IdempotencyService)
// ============================================================

import type { PaymentGateway } from './gateways/gateway.interface';
import { PaymentIntentService } from './payment-intent.service';
import { GatewayChargeService } from './gateway-charge.service';
import { IdempotencyService } from './idempotency/idempotency.service';
import type { CreatePaymentIntentInput } from './payment-intent.types';
import type { ChargeInitiatedResult } from './gateway-charge.types';

export interface InitiatePaymentResult {
  paymentId: number;
  orderId: number;
  redirectUrl: string;
  snapToken: string;
  externalReference: string;
}

export interface InitiatePaymentInput extends CreatePaymentIntentInput {
  returnUrl?: string;
  idempotencyKey: string; // Client-generated UUID for idempotency
}

export class PaymentHandler {
  private readonly gatewayChargeService: GatewayChargeService;
  private readonly idempotencyService: IdempotencyService;

  constructor(gateway: PaymentGateway) {
    this.gatewayChargeService = new GatewayChargeService(gateway);
    this.idempotencyService = new IdempotencyService();
  }

  /**
   * Full payment flow with Idempotency Guard
   *
   * Orchestrates:
   * 1. IdempotencyService.acquire() - atomic key acquisition
   * 2. PaymentIntentService (Domain) - creates Payment record
   * 3. GatewayChargeService (Integration) - initiates charge at provider
   *
   * Flow (Atomic Pattern):
   * 1. acquire() — atomic, returns immediately who owns the key
   * 2. If acquired → process payment
   * 3. If replay → return cached response
   *
   * This pattern PREVENTS race conditions:
   * - Request A & B arrive simultaneously
   * - acquire() for A succeeds (INSERT)
   * - acquire() for B fails (UNIQUE violation)
   * - B gets cached response from A
   */
  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    // STEP 1: Atomic acquire
    const acquireResult =
      await this.idempotencyService.acquire<InitiatePaymentResult>({
        idempotencyKey: input.idempotencyKey,
        resourceType: 'PAYMENT_INITIATE',
      });

    // STEP 2: If replay, return cached response immediately
    if (acquireResult.isReplay && acquireResult.cachedResponse) {
      return acquireResult.cachedResponse;
    }

    // STEP 3: If we acquired the key, process payment
    try {
      const result = await this.processPayment(input);

      // STEP 4: Store successful response
      await this.idempotencyService.complete(
        input.idempotencyKey,
        result.paymentId,
        result,
        200,
      );

      return result;
    } catch (error) {
      // STEP 5: On failure, mark as failed (allows retry)
      await this.idempotencyService.fail(input.idempotencyKey);
      throw error;
    }
  }

  /**
   * Process payment (existing logic from Step 4)
   */
  private async processPayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    const intentResult = await PaymentIntentService.createPaymentIntent({
      orderId: input.orderId,
      userId: input.userId,
      amount: input.amount,
      currency: input.currency,
      provider: input.provider,
    });

    const chargeResult =
      await this.gatewayChargeService.initiateCharge({
        paymentId: intentResult.paymentId,
        orderId: intentResult.orderId,
        amount: intentResult.amount,
        currency: intentResult.currency,
        returnUrl: input.returnUrl,
        externalReference: intentResult.externalReference,
      });

    return {
      paymentId: intentResult.paymentId,
      orderId: intentResult.orderId,
      redirectUrl: chargeResult.redirectUrl,
      snapToken: chargeResult.snapToken,
      externalReference: intentResult.externalReference,
    };
  }

  /**
   * Initiate charge only (for resumed payments)
   * Useful when Payment record already exists
   */
  async initiateChargeOnly(
    paymentId: number,
    orderId: number,
    amount: number,
    currency: string,
    externalReference: string,
    returnUrl?: string,
  ): Promise<ChargeInitiatedResult> {
    return this.gatewayChargeService.initiateCharge({
      paymentId,
      orderId,
      amount,
      currency,
      returnUrl,
      externalReference,
    });
  }
}
