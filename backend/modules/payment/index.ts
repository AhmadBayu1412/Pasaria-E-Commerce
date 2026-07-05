// ============================================================
// PAYMENT MODULE — Public API
// Phase 5 Step 7: Real Gateway Integration
// ============================================================

// ----- Step 2: Payment Domain Foundation -----
export { PaymentRepository } from './payment.repository.js';
export { PaymentMapper } from './payment.mapper.js';

export type {
  Payment,
  PaymentStatus,
  PaymentProvider,
  CreatePaymentInput,
  PaymentViewDTO,
} from './payment.types.js';

export {
  PAYMENT_TERMINAL_STATUSES,
  PAYMENT_ACTIVE_STATUSES,
} from './payment.types.js';

// ----- Step 3: Payment Intent -----
export { PaymentIntentService } from './payment-intent.service.js';

export type {
  CreatePaymentIntentInput,
  PaymentIntentResultDTO,
  PaymentIntentErrorCode,
} from './payment-intent.types.js';

export { PaymentIntentErrorCodes } from './payment-intent.types.js';

// ----- Step 4: Gateway Abstraction -----
export { GatewayFactory } from './gateways/factory/gateway.factory.js';
export { StubGateway } from './gateways/stub/stub.gateway.js';
export type { StubGatewayOptions } from './gateways/stub/stub.gateway.js';

export type { PaymentGateway } from './gateways/gateway.interface.js';

export type {
  ProviderType,
  CreateChargeRequest,
  CreateChargeResult,
  ChargeMetadata,
  ChargeStatus,
} from './gateways/gateway.types.js';

export { PaymentGatewayError, type GatewayErrorType } from './gateways/gateway.errors.js';

// ----- Step 7: HTTP Client & Retry Policy -----
export {
  HttpClient,
  HttpClientError,
  type HttpClientOptions,
  type HttpRequest,
  type HttpResponse,
} from './client/http-client.js';

export { GatewayClient, type GatewayClientConfig } from './client/gateway-client.js';

// ----- Step 7: Midtrans Gateway -----
export {
  MidtransGateway,
  MidtransClient,
  MidtransMapper,
  MidtransSignatureVerifier,
  createMidtransSignature,
  type MidtransGatewayConfig,
} from './gateways/midtrans/index.js';

export type {
  MidtransSnapRequest,
  MidtransSnapResponse,
  MidtransTransactionStatus,
  MidtransTransactionStatusEnum,
} from './gateways/midtrans/midtrans.types.js';

// ----- Step 7: Shared Config -----
export {
  loadGatewayConfig,
  type GatewayConfig,
  type MidtransConfig,
  type XenditConfig,
  type WebhookConfig,
} from '../../shared/config/gateway.config.js';

// ----- Integration Layer -----
export { GatewayChargeService } from './gateway-charge.service.js';

export type {
  InitiateChargeInput,
  ChargeInitiatedResult,
  GatewayChargeErrorCode,
} from './gateway-charge.types.js';

export { GatewayChargeErrorCodes } from './gateway-charge.types.js';

// ----- Step 5: Idempotency Layer -----
export { IdempotencyService } from './idempotency/idempotency.service.js';
export { IdempotencyRepository } from './idempotency/idempotency.repository.js';

export type {
  IdempotencyRecord,
  IdempotencyRecordStatus,
  IdempotencyResourceType,
  AcquireInput,
  AcquireResult,
} from './idempotency/idempotency.types.js';

export {
  IdempotencyErrorCodes,
  IdempotencyKeyExpiredError,
  IdempotencyCheckError,
  IdempotencyRequestInProgressError,
} from './idempotency/idempotency.errors.js';

export {
  IDEMPOTENCY_STATUSES,
  IDEMPOTENCY_RESOURCE_TYPES,
} from './idempotency/idempotency.types.js';

// ----- Step 6: Webhook Processing -----
// Webhook types and errors
export {
  WEBHOOK_EVENT_STATUSES,
  GATEWAY_PROVIDERS,
  WEBHOOK_EVENT_TYPES,
} from './webhook/webhook.types.js';

export type {
  WebhookPayload,
  WebhookEventRecord,
  WebhookResponse,
  WebhookEventStatus,
  GatewayProvider,
  WebhookEventType,
} from './webhook/webhook.types.js';

export {
  WebhookErrorCodes,
  WebhookSignatureError,
  WebhookMissingSignatureError,
  WebhookPayloadError,
  WebhookMissingFieldError,
  WebhookUnsupportedProviderError,
} from './webhook/webhook.errors.js';

// Webhook validator
export { WebhookValidator, type SignatureVerifier, type VerificationResult } from './webhook/webhook.validator.js';

// Webhook repository
export { WebhookRepository } from './webhook/webhook.repository.js';

// Webhook service
export { WebhookService } from './webhook/webhook.service.js';

// Webhook controller
export { WebhookController } from './webhook/webhook.controller.js';

// Payment confirmation service
export { PaymentConfirmationService } from './payment-confirmation.service.js';

export type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
} from './payment-confirmation.service.js';

// ----- Application Layer -----
// Note: PaymentHandler is also known as PaymentApplicationService or PaymentOrchestrator
export {
  PaymentHandler,
  type InitiatePaymentResult,
  type InitiatePaymentInput,
} from './payment-handler.js';
