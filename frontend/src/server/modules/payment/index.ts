// ============================================================
// PAYMENT MODULE — Public API
// Phase 5 Step 7: Real Gateway Integration
// ============================================================

// ----- Step 2: Payment Domain Foundation -----
export { PaymentRepository } from './payment.repository';
export { PaymentMapper } from './payment.mapper';

export type {
  Payment,
  PaymentStatus,
  PaymentProvider,
  CreatePaymentInput,
  PaymentViewDTO,
} from './payment.types';

export {
  PAYMENT_TERMINAL_STATUSES,
  PAYMENT_ACTIVE_STATUSES,
} from './payment.types';

// ----- Step 3: Payment Intent -----
export { PaymentIntentService } from './payment-intent.service';

export type {
  CreatePaymentIntentInput,
  PaymentIntentResultDTO,
  PaymentIntentErrorCode,
} from './payment-intent.types';

export { PaymentIntentErrorCodes } from './payment-intent.types';

// ----- Step 4: Gateway Abstraction -----
export { GatewayFactory } from './gateways/factory/gateway.factory';
export { StubGateway } from './gateways/stub/stub.gateway';
export type { StubGatewayOptions } from './gateways/stub/stub.gateway';

export type { PaymentGateway } from './gateways/gateway.interface';

export type {
  ProviderType,
  CreateChargeRequest,
  CreateChargeResult,
  ChargeMetadata,
  ChargeStatus,
} from './gateways/gateway.types';

export { PaymentGatewayError, type GatewayErrorType } from './gateways/gateway.errors';

// ----- Step 7: HTTP Client & Retry Policy -----
export {
  HttpClient,
  HttpClientError,
  type HttpClientOptions,
  type HttpRequest,
  type HttpResponse,
} from './client/http-client';

export { GatewayClient, type GatewayClientConfig } from './client/gateway-client';

// ----- Step 7: Midtrans Gateway -----
export {
  MidtransGateway,
  MidtransClient,
  MidtransMapper,
  MidtransSignatureVerifier,
  createMidtransSignature,
  type MidtransGatewayConfig,
} from './gateways/midtrans/index';

export type {
  MidtransSnapRequest,
  MidtransSnapResponse,
  MidtransTransactionStatus,
  MidtransTransactionStatusEnum,
} from './gateways/midtrans/midtrans.types';

// ----- Step 7: Shared Config -----
export {
  loadGatewayConfig,
  type GatewayConfig,
  type MidtransConfig,
  type XenditConfig,
  type WebhookConfig,
} from '../../shared/config/gateway.config';

// ----- Integration Layer -----
export { GatewayChargeService } from './gateway-charge.service';

export type {
  InitiateChargeInput,
  ChargeInitiatedResult,
  GatewayChargeErrorCode,
} from './gateway-charge.types';

export { GatewayChargeErrorCodes } from './gateway-charge.types';

// ----- Step 5: Idempotency Layer -----
export { IdempotencyService } from './idempotency/idempotency.service';
export { IdempotencyRepository } from './idempotency/idempotency.repository';

export type {
  IdempotencyRecord,
  IdempotencyRecordStatus,
  IdempotencyResourceType,
  AcquireInput,
  AcquireResult,
} from './idempotency/idempotency.types';

export {
  IdempotencyErrorCodes,
  IdempotencyKeyExpiredError,
  IdempotencyCheckError,
  IdempotencyRequestInProgressError,
} from './idempotency/idempotency.errors';

export {
  IDEMPOTENCY_STATUSES,
  IDEMPOTENCY_RESOURCE_TYPES,
} from './idempotency/idempotency.types';

// ----- Step 6: Webhook Processing -----
// Webhook types and errors
export {
  WEBHOOK_EVENT_STATUSES,
  GATEWAY_PROVIDERS,
  WEBHOOK_EVENT_TYPES,
} from './webhook/webhook.types';

export type {
  WebhookPayload,
  WebhookEventRecord,
  WebhookResponse,
  WebhookEventStatus,
  GatewayProvider,
  WebhookEventType,
} from './webhook/webhook.types';

export {
  WebhookErrorCodes,
  WebhookSignatureError,
  WebhookMissingSignatureError,
  WebhookPayloadError,
  WebhookMissingFieldError,
  WebhookUnsupportedProviderError,
} from './webhook/webhook.errors';

// Webhook validator
export { WebhookValidator, type SignatureVerifier, type VerificationResult } from './webhook/webhook.validator';

// Webhook repository
export { WebhookRepository } from './webhook/webhook.repository';

// Webhook service
export { WebhookService } from './webhook/webhook.service';

// Webhook controller
export { WebhookController } from './webhook/webhook.controller';

// Payment confirmation service
export { PaymentConfirmationService } from './payment-confirmation.service';

export type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
} from './payment-confirmation.service';

// ----- Application Layer -----
// Note: PaymentHandler is also known as PaymentApplicationService or PaymentOrchestrator
export {
  PaymentHandler,
  type InitiatePaymentResult,
  type InitiatePaymentInput,
} from './payment-handler';
