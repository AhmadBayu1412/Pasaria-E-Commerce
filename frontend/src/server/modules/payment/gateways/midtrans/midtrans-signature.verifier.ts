// ============================================================
// MIDTRANS SIGNATURE VERIFIER
// Phase 5 Step 7: Webhook Signature Verification
//
// CRITICAL SECURITY COMPONENT
//
// Midtrans Signature Hash:
// SHA512(order_id + status_code + gross_amount + server_key)
//
// Reference:
// https://docs.midtrans.com/en/technical-reference/signature-hash
// ============================================================

import * as crypto from 'crypto';

export interface WebhookPayload {
  readonly orderId: string;
  readonly status: string; // Midtrans sends status_code here
  readonly amount: number;
  readonly transactionId?: string;
}

export interface SignatureVerifier {
  verify(payload: WebhookPayload, signature: string): boolean;
}

/**
 * Midtrans Signature Verifier
 *
 * CRITICAL: Midtrans signature menggunakan:
 * - order_id
 * - status_code (BUKAN status)
 * - gross_amount
 * - server_key
 */
export class MidtransSignatureVerifier implements SignatureVerifier {
  private readonly serverKey: string;

  constructor(serverKey: string) {
    this.serverKey = serverKey;
  }

  /**
   * Verify Midtrans webhook signature
   */
  verify(payload: WebhookPayload, signature: string): boolean {
    try {
      // Midtrans signature = SHA512(order_id + status_code + gross_amount + server_key)
      const grossAmount = Math.round(payload.amount).toString();
      const signatureKey = crypto
        .createHash('sha512')
        .update(
          payload.orderId + payload.status + grossAmount + this.serverKey,
        )
        .digest('hex');

      // Constant-time comparison untuk prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signatureKey),
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }
}

/**
 * Create signature untuk testing
 */
export function createMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: number,
  serverKey: string,
): string {
  return crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount.toString() + serverKey)
    .digest('hex');
}
