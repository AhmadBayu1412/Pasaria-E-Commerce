// ============================================================
// GATEWAY CHARGE SERVICE
// Phase 5 Step 4: Gateway Abstraction
//
// Philosophy:
// - Integration Layer - connects Domain with External World
// - NO business rules, NO validation, NO ownership checks
// - ONLY translation and orchestration
//
// DI Pattern:
// - Gateway injected via constructor
// - Service does NOT create gateway instance
// ============================================================

import type { PaymentGateway } from './gateways/gateway.interface';
import type {
  CreateChargeRequest,
  CreateChargeResult,
} from './gateways/gateway.types';
import { PaymentGatewayError } from './gateways/gateway.errors';
import type {
  InitiateChargeInput,
  ChargeInitiatedResult,
} from './gateway-charge.types';
import { GatewayChargeErrorCodes } from './gateway-charge.types';
import { BusinessError } from '../../shared/errors/business.error';

export class GatewayChargeService {
  constructor(private readonly gateway: PaymentGateway) {}

  async initiateCharge(
    input: InitiateChargeInput,
  ): Promise<ChargeInitiatedResult> {
    const request = this.buildRequest(input);

    let result: CreateChargeResult;
    try {
      result = await this.gateway.createCharge(request);
    } catch (error) {
      throw this.translateError(error);
    }

    if (result.chargeStatus === 'FAILED') {
      throw new BusinessError(
        `Charge creation failed: ${result.snapToken}`,
        502,
        GatewayChargeErrorCodes.GATEWAY_ERROR,
      );
    }

    return {
      paymentId: input.paymentId,
      snapToken: result.snapToken,
      redirectUrl: result.redirectUrl,
      chargeCreatedAt: result.createdAt,
    };
  }

  private buildRequest(input: InitiateChargeInput): CreateChargeRequest {
    return {
      paymentId: input.paymentId,
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      returnUrl: input.returnUrl,
      externalReference: input.externalReference,
    };
  }

  private translateError(error: unknown): BusinessError {
    if (error instanceof PaymentGatewayError) {
      return new BusinessError(
        `Payment gateway error: ${error.type} - ${error.message}`,
        this.mapErrorToStatusCode(error),
        GatewayChargeErrorCodes.GATEWAY_ERROR,
      );
    }

    return new BusinessError(
      `Unexpected gateway error: ${String(error)}`,
      502,
      GatewayChargeErrorCodes.GATEWAY_ERROR,
    );
  }

  private mapErrorToStatusCode(error: PaymentGatewayError): number {
    switch (error.type) {
      case 'AUTH_ERROR':
        return 500;
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
      case 'PROVIDER_ERROR':
        return 502;
      case 'INVALID_REQUEST':
        return 400;
      default:
        return 502;
    }
  }
}
