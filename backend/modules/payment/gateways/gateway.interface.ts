// ============================================================
// PAYMENT GATEWAY INTERFACE
// Phase 5 Step 4: Gateway Abstraction
//
// Philosophy:
// - Interface owned by DOMAIN
// - Implementation owned by INFRASTRUCTURE
// - Domain does NOT know how provider works
// - Provider MUST conform to domain contract
//
// Minimal Interface:
// - Only one method: createCharge()
// - queryCharge() removed (YAGNI - added when needed in Step 5+)
// ============================================================

import type { CreateChargeRequest, CreateChargeResult } from './gateway.types.js';

export interface PaymentGateway {
  /**
   * Create Charge
   *
   * Translates: Domain Request → Provider Request → Domain Result
   *
   * @param request - Charge request in domain language
   * @returns Charge result in domain language
   * @throws PaymentGatewayError - Error translated to domain language
   */
  createCharge(request: CreateChargeRequest): Promise<CreateChargeResult>;
}
