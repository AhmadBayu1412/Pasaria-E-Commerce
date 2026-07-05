// ============================================================
// GATEWAY CHARGE TYPES
// Phase 5 Step 4: Gateway Abstraction
//
// Philosophy:
// - Integration Layer types
// - Translates between Domain and Gateway
// ============================================================

// ----- Input -----
export interface InitiateChargeInput {
  readonly paymentId: number;
  readonly orderId: number;
  readonly amount: number;
  readonly currency: string;
  readonly returnUrl?: string;
}

// ----- Result -----
export interface ChargeInitiatedResult {
  readonly paymentId: number;
  readonly gatewayTransactionId: string;
  readonly redirectUrl: string | null;
  readonly chargeCreatedAt: Date;
}

// ----- Error Codes -----
export const GatewayChargeErrorCodes = {
  GATEWAY_ERROR: 'GATEWAY_ERROR',
  GATEWAY_UNAVAILABLE: 'GATEWAY_UNAVAILABLE',
} as const;

export type GatewayChargeErrorCode =
  (typeof GatewayChargeErrorCodes)[keyof typeof GatewayChargeErrorCodes];
