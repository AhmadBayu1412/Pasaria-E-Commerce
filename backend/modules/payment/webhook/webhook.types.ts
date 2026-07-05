// ============================================================
// WEBHOOK TYPES
// Phase 5 Step 6: Webhook Processing & Payment Confirmation
//
// Philosophy:
// - Minimal types for webhook transport
// - Business types in Payment domain
// - Step 6: STUB only, extensible for Step 7
// ============================================================

// ----- Event Status -----
export const WEBHOOK_EVENT_STATUSES = ['PENDING', 'PROCESSED', 'FAILED'] as const;
export type WebhookEventStatus = (typeof WEBHOOK_EVENT_STATUSES)[number];

// ----- Gateway Providers -----
export const GATEWAY_PROVIDERS = ['STUB', 'MIDTRANS', 'XENDIT'] as const;
export type GatewayProvider = (typeof GATEWAY_PROVIDERS)[number];

// ----- Event Types -----
export const WEBHOOK_EVENT_TYPES = [
  'PAYMENT_SETTLEMENT',
  'PAYMENT_PENDING',
  'PAYMENT_EXPIRE',
  'PAYMENT_DENY',
] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

// ----- Raw Webhook Payload (from gateway) -----
export interface WebhookPayload {
  readonly transactionId: string;
  readonly orderId: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly timestamp: string;
  readonly signature?: string;
}

// ----- Webhook Event Record -----
export interface WebhookEventRecord {
  readonly id: number;
  readonly gatewayTransactionId: string;
  readonly gatewayProvider: GatewayProvider;
  readonly eventType: WebhookEventType;
  readonly paymentId: number | null;
  readonly rawPayload: WebhookPayload;
  readonly status: WebhookEventStatus;
  readonly processedAt: Date | null;
  readonly errorMessage: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ----- HTTP Response Strategy -----
//
// | Scenario                    | HTTP Status | Why                           |
// |-----------------------------|-------------|-------------------------------|
// | Valid signature, processed  | 200         | Gateway stops retry           |
// | Duplicate (already done)    | 200         | Gateway stops retry           |
// | Invalid signature          | 403         | Security — reject invalid      |
// | Invalid payload format     | 400         | Client error                  |
// | Missing required field     | 400         | Client error                  |
// | Unsupported provider       | 400         | Provider not recognized        |
// | Internal error after verify| 200         | Log internally, stop retry    |
//
// CRITICAL: Return 200 for processing outcomes to stop gateway retry loops
// Only return 4xx for client-side issues (signature, payload)
// ============================================================
export interface WebhookResponse {
  readonly statusCode: number;
  readonly body: object;
  readonly shouldLog: boolean;
}
