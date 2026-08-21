// ============================================================
// WEBHOOK VALIDATOR
// Phase 5 Step 6: Signature Verification
//
// Philosophy:
// - Pure interface for signature verification
// - Step 6: STUB implementation only
// - Step 7: Midtrans/Xendit implementations
// - Returns result, never throws
// ============================================================

import type { WebhookPayload, GatewayProvider } from './webhook.types';

/**
 * Signature Verifier Interface
 *
 * Implementations (Step 7):
 * - StubSignatureVerifier: Always returns valid
 * - MidtransSignatureVerifier: SHA512 hash
 * - XenditSignatureVerifier: SHA256 with callback token
 */
export interface SignatureVerifier {
  readonly provider: GatewayProvider;
  verify(payload: WebhookPayload, signature: string): boolean;
}

/**
 * Verification Result
 * Always returned, never thrown
 */
export interface VerificationResult {
  readonly valid: boolean;
  readonly provider: GatewayProvider;
  readonly error?: string;
}

/**
 * STUB Signature Verifier — Always valid in development
 *
 * NOTE: In production, this should be disabled
 * and only configured providers should accept webhooks
 */
class StubSignatureVerifier implements SignatureVerifier {
  readonly provider: GatewayProvider = 'STUB';

  verify(): boolean {
    // WARNING: Only for development/testing
    // In production, use real signature verification
    return true;
  }
}

export class WebhookValidator {
  private verifiers: Map<GatewayProvider, SignatureVerifier>;

  constructor(options?: {
    stubEnabled?: boolean;
    // Step 7: Add provider configs here
    // midtransServerKey?: string;
    // xenditCallbackToken?: string;
  }) {
    this.verifiers = new Map();

    // STUB verifier for development
    if (options?.stubEnabled ?? true) {
      this.verifiers.set('STUB', new StubSignatureVerifier());
    }

    // Step 7: Load real verifiers from config
    // if (options?.midtransServerKey) {
    //   this.verifiers.set('MIDTRANS', new MidtransSignatureVerifier(options.midtransServerKey));
    // }
  }

  /**
   * Verify webhook signature
   *
   * @returns VerificationResult (never throws)
   *
   * Caller decides HTTP response based on result:
   * - valid: true → proceed
   * - valid: false → 403 Forbidden
   */
  verify(payload: WebhookPayload, provider: GatewayProvider): VerificationResult {
    // Check provider is supported
    const verifier = this.verifiers.get(provider);
    if (!verifier) {
      return {
        valid: false,
        provider,
        error: `Unsupported provider: ${provider}`,
      };
    }

    // Check signature exists
    const signature = payload.signature;
    if (!signature) {
      return {
        valid: false,
        provider,
        error: `Missing signature for ${provider}`,
      };
    }

    // Verify
    const valid = verifier.verify(payload, signature);
    if (!valid) {
      return {
        valid: false,
        provider,
        error: `Signature verification failed for ${provider}`,
      };
    }

    return { valid: true, provider };
  }

  /**
   * Check if provider is supported
   */
  supports(provider: GatewayProvider): boolean {
    return this.verifiers.has(provider);
  }
}
