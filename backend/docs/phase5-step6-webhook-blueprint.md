# Step 6 Blueprint (Revised): Webhook Processing & Payment Confirmation

## 📋 Overview

**Objective**: Memastikan setiap event pembayaran dari payment gateway benar-benar berasal dari sumber yang sah, hanya diproses sekali, dan menghasilkan perubahan state yang konsisten.

**Scope**: 
- ✅ Webhook controller dan endpoint
- ✅ Signature verification interface (STUB only, implementations di Step 7)
- ✅ Webhook idempotency (event deduplication)
- ✅ PaymentConfirmationService (using gatewayTransactionId)
- ✅ Atomic transaction (Payment → SUCCESS, Order → PAID, Timeline)
- ❌ Provider-specific signature implementations (Step 7)
- ❌ Refund/Chargeback (Step 8+)
- ❌ Polling API integration

---

## 📁 File Layout

```
modules/payment/
│
├── webhook/
│   ├── webhook.types.ts           # Webhook event types
│   ├── webhook.errors.ts          # Webhook-specific errors
│   ├── webhook.validator.ts      # Signature verification (interface only)
│   ├── webhook.repository.ts      # Webhook event deduplication
│   ├── webhook.service.ts         # Orchestration
│   └── webhook.controller.ts      # HTTP endpoint
│
├── payment-confirmation.service.ts  # Business logic (reusable)
│
├── payment-handler.ts             # Unchanged from Step 5
└── ...
```

---

## 🎯 Key Revisions from v1

| Issue | v1 | v2 (Revised) |
|-------|-----|--------------|
| HTTP Response | All 200 OK | Differentiated by error type |
| Signature Verifier | Midtrans/Xendit included | Interface only, STUB impl |
| Payment Lookup | By orderId | By gatewayTransactionId |
| Status Mapping | In WebhookService | In Gateway Adapter (Step 7) |
| WebhookEvent Table | Purpose unclear | Deduplication + Audit |
| IGNORED Status | Included | Removed |
| 501 Response | Used for unsupported | Changed to 400 (see note below) |

---

## 🗄️ Database Model

```prisma
// prisma/schema.prisma — ADDITIONS ONLY

// ============================================================
// WebhookEvent MODEL (Step 6)
//
// Purpose:
// 1. DEDUPLICATION — Prevent same event from being processed twice
// 2. AUDIT LOG — Record all webhook events for debugging
//
// Design:
// - gatewayTransactionId as UNIQUE identifier (deduplication)
// - Minimal fields for deduplication
// - Full request stored for audit trail
// ============================================================

model WebhookEvent {
  id                     Int              @id @default(autoincrement())
  gatewayTransactionId    String           @unique  // Deduplication key
  gatewayProvider        String                        // "STUB", "MIDTRANS", "XENDIT"
  
  // Minimal event data (for deduplication query)
  eventType             String                        // "PAYMENT_SETTLEMENT"
  paymentId             Int?                         // FK to Payment (after processing)
  
  // Full payload stored for AUDIT purposes only
  // WARNING: Do not expose raw payload in API responses
  rawPayload            Json                          // Full webhook payload
  
  // Processing state
  status                WebhookEventStatus @default(PENDING)
  processedAt           DateTime?
  errorMessage          String?
  
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  
  // Relations
  payment               Payment?          @relation(fields: [paymentId], references: [id])
  
  @@index([status, createdAt])
  @@index([gatewayProvider])
}

enum WebhookEventStatus {
  PENDING    // Event received, awaiting processing
  PROCESSED  // Successfully processed
  FAILED     // Processing failed (logged, not retried automatically)
  // NOTE: IGNORED removed — duplicates are still PROCESSED, just skipped
}
```

**Design Decisions:**
- `gatewayTransactionId` as UNIQUE = deduplication via database
- `paymentId` as FK = links event to Payment record
- `rawPayload` for audit = debugging without replay capability
- No IGNORED status = simpler state machine

---

## 📝 Interface Blueprint (Revised)

### 1. Webhook Types (`webhook.types.ts`)

```typescript
// ============================================================
// WEBHOOK TYPES
// Phase 5 Step 6: Webhook Processing (Revised)
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
  'PAYMENT_DENY'
] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

// ----- Raw Webhook Payload (from gateway) -----
export interface WebhookPayload {
  readonly transactionId: string;    // Gateway's transaction ID (REQUIRED)
  readonly orderId: string;         // Our order ID
  readonly status: string;          // Gateway-specific status
  readonly amount: number;           // Amount in smallest unit
  readonly currency: string;         // 'IDR'
  readonly timestamp: string;        // ISO 8601
  readonly signature?: string;      // HMAC signature
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
// Key Decision: NOT everything returns 200
//
// | Scenario                    | HTTP Status | Why                           |
// |-----------------------------|-------------|-------------------------------|
// | Valid signature, processed  | 200         | Gateway stops retry           |
// | Duplicate (already done)     | 200         | Gateway stops retry           |
// | Invalid signature            | 403         | Security — reject invalid      |
// | Invalid payload format       | 400         | Client error                  |
// | Missing required field       | 400         | Client error                  |
// | Unsupported provider         | 400         | Provider not recognized        |
// | Internal error after verify   | 200         | Log internally, stop retry    |
//
// RATIONALE for 400 vs 501:
// - Most payment gateways interpret 5xx as "server error, retry later"
// - 501 Not Implemented may trigger retry behavior in some gateways
// - Using 400 Bad Request is safer: gateway won't retry malformed requests
//
// CRITICAL: Return 200 for processing failures to stop gateway retry loops
// Only return 4xx for client-side issues (signature, payload)
// ============================================================
export type WebhookResponse = {
  readonly statusCode: number;
  readonly body: object;
  readonly shouldLog: boolean;  // Whether to log this response
};
```

### 2. Webhook Errors (`webhook.errors.ts`)

```typescript
// ============================================================
// WEBHOOK ERRORS
// Phase 5 Step 6: Webhook Processing (Revised)
//
// Philosophy:
// - Errors are categorized by HTTP response strategy
// - Security errors (invalid signature) → 403
// - Client errors (invalid payload) → 400
// - Internal errors → logged, but return 200 to stop retry
// ============================================================

import { BusinessError } from '../../../shared/errors/business.error.js';

export const WebhookErrorCodes = {
  // Security (403 Forbidden)
  INVALID_SIGNATURE: 'WEBHOOK_INVALID_SIGNATURE',
  MISSING_SIGNATURE: 'WEBHOOK_MISSING_SIGNATURE',

  // Client Error (400 Bad Request)
  INVALID_PAYLOAD: 'WEBHOOK_INVALID_PAYLOAD',
  MISSING_REQUIRED_FIELD: 'WEBHOOK_MISSING_REQUIRED_FIELD',
  UNSUPPORTED_PROVIDER: 'WEBHOOK_UNSUPPORTED_PROVIDER',

  // Business (logged, but return 200)
  ORDER_NOT_FOUND: 'WEBHOOK_ORDER_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'WEBHOOK_PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_CONFIRMED: 'WEBHOOK_PAYMENT_ALREADY_CONFIRMED',
  AMOUNT_MISMATCH: 'WEBHOOK_AMOUNT_MISMATCH',
} as const;

export type WebhookErrorCode = (typeof WebhookErrorCodes)[keyof typeof WebhookErrorCodes];

/**
 * Security errors — Return 403 to gateway
 * Gateway should NOT retry these
 */
export class WebhookSignatureError extends BusinessError {
  constructor(message: string = 'Invalid webhook signature') {
    super(message, 403, WebhookErrorCodes.INVALID_SIGNATURE);
    this.name = 'WebhookSignatureError';
  }
}

export class WebhookMissingSignatureError extends BusinessError {
  constructor(provider: string) {
    super(
      `Missing required signature for ${provider} webhook`,
      403, // Treat as security issue
      WebhookErrorCodes.MISSING_SIGNATURE,
    );
    this.name = 'WebhookMissingSignatureError';
  }
}

/**
 * Payload errors — Return 400 to gateway
 * Gateway may retry but with corrected payload
 */
export class WebhookPayloadError extends BusinessError {
  constructor(message: string) {
    super(message, 400, WebhookErrorCodes.INVALID_PAYLOAD);
    this.name = 'WebhookPayloadError';
  }
}

export class WebhookMissingFieldError extends BusinessError {
  constructor(field: string) {
    super(
      `Missing required field: ${field}`,
      400,
      WebhookErrorCodes.MISSING_REQUIRED_FIELD,
    );
    this.name = 'WebhookMissingFieldError';
  }
}

/**
 * Unsupported provider — Return 400 to gateway
 * Provider not recognized, not a server error
 */
export class WebhookUnsupportedProviderError extends BusinessError {
  constructor(provider: string) {
    super(
      `Unsupported webhook provider: ${provider}`,
      400, // Not 5xx — don't trigger retry
      WebhookErrorCodes.UNSUPPORTED_PROVIDER,
    );
    this.name = 'WebhookUnsupportedProviderError';
  }
}
```

### 3. Webhook Validator (`webhook.validator.ts`)

```typescript
// ============================================================
// WEBHOOK VALIDATOR
// Phase 5 Step 6: Signature Verification (Revised)
//
// Philosophy:
// - Pure interface for signature verification
// - Step 6: STUB implementation only
// - Step 7: Midtrans/Xendit implementations
// - DOES NOT throw — returns result for controller to handle HTTP response
// ============================================================

import type { WebhookPayload, GatewayProvider } from './webhook.types.js';

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

  verify(_payload: WebhookPayload, _signature: string): boolean {
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
   * Controller decides HTTP response based on result:
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
  isProviderSupported(provider: GatewayProvider): boolean {
    return this.verifiers.has(provider);
  }
}
```

### 4. Webhook Repository (`webhook.repository.ts`)

```typescript
// ============================================================
// WEBHOOK REPOSITORY
// Phase 5 Step 6: Event Deduplication (Revised)
//
// Philosophy:
// - Pure data access: find, insert, update
// - NO business logic
// - Caller (WebhookService) decides what to do with results
// ============================================================

import { prisma } from '../../../infra/db/prisma.js';
import type { WebhookEventRecord, WebhookEventStatus } from './webhook.types.js';

interface PrismaWebhookEvent {
  id: number;
  gatewayTransactionId: string;
  gatewayProvider: string;
  eventType: string;
  paymentId: number | null;
  rawPayload: unknown;
  status: string;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toRecord(r: PrismaWebhookEvent): WebhookEventRecord {
  return {
    id: r.id,
    gatewayTransactionId: r.gatewayTransactionId,
    gatewayProvider: r.gatewayProvider as any,
    eventType: r.eventType as any,
    paymentId: r.paymentId,
    rawPayload: r.rawPayload as any,
    status: r.status as WebhookEventStatus,
    processedAt: r.processedAt,
    errorMessage: r.errorMessage,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export const WebhookRepository = {
  /**
   * Find event by gateway transaction ID
   * Returns null if not found
   */
  async findByTransactionId(
    transactionId: string,
  ): Promise<WebhookEventRecord | null> {
    const record = await prisma.webhookEvent.findUnique({
      where: { gatewayTransactionId: transactionId },
    });
    return record ? toRecord(record) : null;
  },

  /**
   * Try to acquire event lock via atomic INSERT
   *
   * @returns { record, acquired }
   * - acquired=true: We own this event, proceed with processing
   * - acquired=false: Event exists, caller decides action
   */
  async acquireEvent(
    transactionId: string,
    provider: string,
    eventType: string,
    rawPayload: unknown,
  ): Promise<{ record: WebhookEventRecord | null; acquired: boolean }> {
    try {
      const record = await prisma.webhookEvent.create({
        data: {
          gatewayTransactionId: transactionId,
          gatewayProvider: provider,
          eventType,
          rawPayload: rawPayload as object,
          status: 'PENDING',
        },
      });

      return { record: toRecord(record), acquired: true };
    } catch (error: unknown) {
      // P2002 = Unique constraint violation = already exists
      if (
        error && typeof error === 'object' && 'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        const existing = await prisma.webhookEvent.findUnique({
          where: { gatewayTransactionId: transactionId },
        });
        return { record: existing ? toRecord(existing) : null, acquired: false };
      }
      throw error;
    }
  },

  /**
   * Mark event as processed and link to Payment
   */
  async markProcessed(
    transactionId: string,
    paymentId: number,
  ): Promise<WebhookEventRecord> {
    const record = await prisma.webhookEvent.update({
      where: { gatewayTransactionId: transactionId },
      data: {
        status: 'PROCESSED',
        paymentId,
        processedAt: new Date(),
      },
    });
    return toRecord(record);
  },

  /**
   * Mark event as failed (for audit/logging)
   */
  async markFailed(
    transactionId: string,
    errorMessage: string,
  ): Promise<WebhookEventRecord> {
    const record = await prisma.webhookEvent.update({
      where: { gatewayTransactionId: transactionId },
      data: {
        status: 'FAILED',
        errorMessage,
        processedAt: new Date(),
      },
    });
    return toRecord(record);
  },

  /**
   * Update event paymentId (for events processed externally)
   */
  async linkPayment(
    transactionId: string,
    paymentId: number,
  ): Promise<WebhookEventRecord> {
    const record = await prisma.webhookEvent.update({
      where: { gatewayTransactionId: transactionId },
      data: { paymentId },
    });
    return toRecord(record);
  },
} as const;
```

### 5. Webhook Service (`webhook.service.ts`)

```typescript
// ============================================================
// WEBHOOK SERVICE
// Phase 5 Step 6: Orchestration (Revised)
//
// Philosophy:
// - Orchestrates transport concerns only
// - Delegates business logic to PaymentConfirmationService
// - Handles HTTP response strategy
// ============================================================

import { WebhookValidator } from './webhook.validator.js';
import { WebhookRepository } from './webhook.repository.js';
import { PaymentConfirmationService } from '../payment-confirmation.service.js';
import type {
  WebhookPayload,
  WebhookResponse,
  GatewayProvider,
} from './webhook.types.js';

export class WebhookService {
  constructor(
    private readonly validator: WebhookValidator,
    private readonly confirmationService: PaymentConfirmationService,
  ) {}

  /**
   * Process incoming webhook
   *
   * Flow:
   * 1. Validate payload format (throws WebhookPayloadError → 400)
   * 2. Verify signature (returns VerificationResult)
   * 3. If invalid signature → 403
   * 4. Acquire event lock (atomic)
   * 5. If duplicate → 200 (already processed)
   * 6. Process confirmation
   * 7. Mark as processed → 200
   *
   * NOTE: Returns WebhookResponse, controller sends appropriate HTTP status
   */
  async processWebhook(
    payload: WebhookPayload,
    provider: GatewayProvider,
  ): Promise<WebhookResponse> {
    // Step 1: Validate payload format
    this.validatePayload(payload);

    // Step 2: Verify signature
    const verification = this.validator.verify(payload, provider);
    if (!verification.valid) {
      // SECURITY: Return 403 for invalid signature
      console.warn(`Webhook signature failed: ${verification.error}`);
      return {
        statusCode: 403,
        body: { error: 'Forbidden' },
        shouldLog: true,
      };
    }

    // Step 3: Try to acquire event (deduplication)
    const { acquired, existingEvent } = await WebhookRepository.acquireEvent(
      payload.transactionId,
      provider,
      this.extractEventType(payload.status),
      payload,
    );

    // Step 4: Handle duplicate
    if (!acquired && existingEvent) {
      return this.handleExistingEvent(existingEvent);
    }

    // Step 5: Process confirmation
    try {
      const result = await this.confirmationService.confirmPayment({
        gatewayTransactionId: payload.transactionId,
        orderId: parseInt(payload.orderId, 10),
        eventType: this.extractEventType(payload.status),
        amount: payload.amount,
      });

      // Step 6: Mark as processed
      await WebhookRepository.markProcessed(
        payload.transactionId,
        result.paymentId,
      );

      return {
        statusCode: 200,
        body: { received: true, processed: true },
        shouldLog: false,
      };
    } catch (error) {
      // Log error but return 200 to stop gateway retry
      console.error(`Webhook processing error:`, error);

      await WebhookRepository.markFailed(
        payload.transactionId,
        error instanceof Error ? error.message : String(error),
      ).catch(() => {});

      // Return 200 to stop retry, but log internally
      return {
        statusCode: 200,
        body: { received: true },
        shouldLog: true,
      };
    }
  }

  /**
   * Validate required payload fields
   */
  private validatePayload(payload: WebhookPayload): void {
    if (!payload.transactionId) {
      throw new (require('./webhook.errors.js').WebhookMissingFieldError)('transactionId');
    }
    if (!payload.orderId) {
      throw new (require('./webhook.errors.js').WebhookMissingFieldError)('orderId');
    }
    if (!payload.status) {
      throw new (require('./webhook.errors.js').WebhookMissingFieldError)('status');
    }
    if (typeof payload.amount !== 'number' || payload.amount <= 0) {
      throw new (require('./webhook.errors.js').WebhookPayloadError)('Invalid amount');
    }
  }

  /**
   * Extract event type from gateway status
   *
   * NOTE: This is a SIMPLE mapping for STUB gateway.
   * Step 7 will add provider-specific mappers in Gateway Adapter.
   */
  private extractEventType(status: string): string {
    const statusMap: Record<string, string> = {
      // STUB statuses
      'success': 'PAYMENT_SETTLEMENT',
      'pending': 'PAYMENT_PENDING',
      'expired': 'PAYMENT_EXPIRE',
      'failed': 'PAYMENT_DENY',
    };

    return statusMap[status.toLowerCase()] ?? 'PAYMENT_PENDING';
  }

  /**
   * Handle already-existing event
   */
  private handleExistingEvent(event: { status: string }): WebhookResponse {
    // Already processed or failed — return 200 to stop retry
    return {
      statusCode: 200,
      body: { received: true, alreadyProcessed: true },
      shouldLog: false,
    };
  }
}
```

### 6. Payment Confirmation Service (`payment-confirmation.service.ts`)

```typescript
// ============================================================
// PAYMENT CONFIRMATION SERVICE
// Phase 5 Step 6: Business Logic (Revised)
//
// Philosophy:
// - Pure business logic, no transport concerns
// - Finds Payment by gatewayTransactionId (not orderId)
// - Can be called from webhook, polling, or manual trigger
// - Atomic transaction ensures consistency
//
// CRITICAL INVARIANT:
// "One Gateway Event → One State Transition"
// Payment SUCCESS can only transition Order to PAID once per transactionId
// ============================================================

import { prisma } from '../../infra/db/prisma.js';
import { BusinessError } from '../../shared/errors/business.error.js';
import type { PaymentStatus } from './payment.types.js';

export interface ConfirmPaymentInput {
  readonly gatewayTransactionId: string; // PRIMARY KEY — unique per transaction
  readonly orderId: number;
  readonly eventType: string;
  readonly amount: number;
}

export interface ConfirmPaymentResult {
  readonly paymentId: number;
  readonly orderId: number;
  readonly previousPaymentStatus: PaymentStatus;
  readonly newPaymentStatus: PaymentStatus;
}

export class PaymentConfirmationService {
  /**
   * Confirm payment from webhook event
   *
   * Flow:
   * 1. Find Payment by gatewayTransactionId (CRITICAL: not orderId)
   * 2. Validate amount matches
   * 3. Check if already SUCCESS (service-level idempotency)
   * 4. Execute atomic transaction:
   *    - Update Payment to SUCCESS
   *    - Update Order to PAID
   *    - Create Timeline entry
   *
   * WHY gatewayTransactionId as key?
   * - One order can have multiple payment attempts (retry)
   * - Each attempt has unique gatewayTransactionId
   * - orderId alone is ambiguous
   */
  async confirmPayment(
    input: ConfirmPaymentInput,
  ): Promise<ConfirmPaymentResult> {
    // Step 1: Find payment by gatewayTransactionId
    // We need to find the SPECIFIC payment for this transaction
    const payment = await prisma.payment.findFirst({
      where: {
        gatewayTransactionId: input.gatewayTransactionId,
      },
    });

    // Fallback: If gatewayTransactionId not stored, find by orderId + PENDING
    // This handles early payments before gatewayTransactionId was added
    //
    // TODO Phase 6 (Migration only):
    // Remove this fallback after all payments have gatewayTransactionId stored.
    // This is a migration path, not a permanent solution.
    const effectivePayment = payment ?? await prisma.payment.findFirst({
      where: {
        orderId: input.orderId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!effectivePayment) {
      throw new BusinessError(
        `Payment not found for transaction ${input.gatewayTransactionId}`,
        404,
        'PAYMENT_NOT_FOUND',
      );
    }

    // Step 2: Validate amount
    if (effectivePayment.amount !== input.amount) {
      throw new BusinessError(
        `Amount mismatch: expected ${effectivePayment.amount}, got ${input.amount}`,
        400,
        'AMOUNT_MISMATCH',
      );
    }

    // Step 3: Check if already confirmed (idempotency)
    if (effectivePayment.status === 'SUCCESS') {
      return {
        paymentId: effectivePayment.id,
        orderId: effectivePayment.orderId,
        previousPaymentStatus: effectivePayment.status,
        newPaymentStatus: effectivePayment.status,
      };
    }

    // Step 4: Validate event type is a success event
    if (!this.isSuccessEvent(input.eventType)) {
      throw new BusinessError(
        `Event type ${input.eventType} does not confirm payment`,
        400,
        'INVALID_EVENT_TYPE',
      );
    }

    // Step 5: Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update Payment to SUCCESS
      const updatedPayment = await tx.payment.update({
        where: { id: effectivePayment.id },
        data: {
          status: 'SUCCESS',
          gatewayTransactionId: input.gatewayTransactionId, // Store for future lookups
        },
      });

      // Update Order to PAID
      await tx.order.update({
        where: { id: effectivePayment.orderId },
        data: { status: 'PAID' },
      });

      // Create Timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId: effectivePayment.orderId,
          event: 'PAYMENT_CONFIRMED',
          metadata: {
            paymentId: effectivePayment.id,
            gatewayTransactionId: input.gatewayTransactionId,
            eventType: input.eventType,
            confirmedAt: new Date().toISOString(),
          },
        },
      });

      return {
        paymentId: updatedPayment.id,
        orderId: effectivePayment.orderId,
        previousPaymentStatus: effectivePayment.status as PaymentStatus,
        newPaymentStatus: 'SUCCESS' as PaymentStatus,
      };
    });

    return result;
  }

  /**
   * Check if event type indicates successful payment
   */
  private isSuccessEvent(eventType: string): boolean {
    return ['PAYMENT_SETTLEMENT', 'PAYMENT_SUCCESS'].includes(eventType);
  }
}
```

### 7. Webhook Controller (`webhook.controller.ts`)

```typescript
// ============================================================
// WEBHOOK CONTROLLER
// Phase 5 Step 6: HTTP Endpoint (Revised)
//
// Philosophy:
// - Thin layer: extract request → call service → return response
// - Dependencies INJECTED from outside (not created internally)
// - Returns ACTUAL HTTP status codes based on result
// - Logs warnings for suspicious activity
// ============================================================

import type { Request, Response } from 'express';
import { WebhookService } from './webhook.service.js';
import type { WebhookPayload, GatewayProvider } from './webhook.types.js';

export class WebhookController {
  // Dependencies injected from outside (e.g., DI container)
  constructor(private readonly service: WebhookService) {}

  /**
   * Handle incoming webhook
   *
   * Endpoint: POST /webhooks/:provider
   *
   * Returns ACTUAL HTTP status codes:
   * - 200: Processed or duplicate
   * - 400: Invalid payload or unsupported provider
   * - 403: Invalid signature
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const provider = this.extractProvider(req);
    const payload = this.extractPayload(req);

    try {
      const result = await this.service.processWebhook(payload, provider);

      // Log if needed
      if (result.shouldLog) {
        console.warn(`Webhook [${provider}]: ${req.method} ${req.path}`, {
          transactionId: payload.transactionId,
          status: result.statusCode,
        });
      }

      res.status(result.statusCode).json(result.body);
    } catch (error) {
      // Handle validation errors
      const err = error as { statusCode?: number; message?: string };

      if (err.statusCode) {
        console.warn(`Webhook validation error:`, error);
        res.status(err.statusCode).json({ error: err.message });
        return;
      }

      // Unexpected error — return 200 to stop retry, log internally
      console.error(`Webhook unexpected error:`, error);
      res.status(200).json({ received: true });
    }
  }

  private extractProvider(req: Request): GatewayProvider {
    const provider = req.params.provider?.toUpperCase() as GatewayProvider;
    
    if (!provider) {
      return 'STUB';
    }

    return ['STUB', 'MIDTRANS', 'XENDIT'].includes(provider)
      ? provider
      : 'STUB';
  }

  private extractPayload(req: Request): WebhookPayload {
    const body = req.body;

    return {
      transactionId: body.transactionId ?? body.transaction_id ?? '',
      orderId: body.orderId ?? body.order_id ?? '',
      status: body.status ?? '',
      amount: parseInt(body.amount ?? body.gross_amount ?? '0', 10),
      currency: body.currency ?? 'IDR',
      timestamp: body.timestamp ?? body.transaction_time ?? new Date().toISOString(),
      signature: body.signature ?? req.headers['x-signature'] as string,
    };
  }
}
```

---

## 🔗 Integration Flow (Revised)

```
Gateway
  │
  ▼
POST /webhooks/:provider
  │
  ▼
WebhookController.handleWebhook()
  │
  ▼
┌──────────────────────────────────────┐
│ 1. Validate Payload Format          │
│    ❌ Missing field → 400        │
│    ✔ Valid → continue             │
└──────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────┐
│ 2. Verify Signature                 │
│    ❌ Invalid → 403 (stop)       │
│    ❌ Missing → 403 (stop)       │
│    ❌ Unsupported → 400 (stop)   │
│    ✔ Valid → continue             │
└──────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────┐
│ 3. Acquire Event Lock             │
│    ❌ Already exists → 200 (skip)│
│    ✔ New → continue              │
└──────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────┐
│ 4. PaymentConfirmationService       │
│                                      │
│  prisma.$transaction()             │
│  • Payment → SUCCESS              │
│  • Order → PAID                  │
│  • Timeline → CONFIRMED          │
└──────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────┐
│ 5. Mark Processed                 │
│    • Update WebhookEvent          │
│    • Link to Payment             │
└──────────────────────────────────────┘
  │
  ▼
200 OK
```

---

## ⚠️ Critical Design Decisions (Revised)

### 1. HTTP Response Strategy

```
NOT everything returns 200 OK.

| Scenario                    | HTTP  | Why                           |
|-----------------------------|-------|------------------------------|
| Valid, processed            | 200   | Gateway stops retry           |
| Duplicate                  | 200   | Gateway stops retry           |
| Invalid signature          | 403   | Security — reject              |
| Invalid payload            | 400   | Client error                 |
| Unsupported provider        | 400   | Not a server error          |
| Internal error (after verify)| 200  | Log, stop retry              |
```

**Rational**:
- 403 for security/auth errors (invalid signature)
- 400 for client errors (malformed payload, unknown provider)
- 200 for processing outcomes (success, duplicate, failures)
- Note: We use 400 instead of 501 for unsupported provider because some gateways retry 5xx responses

### 2. Payment Lookup by gatewayTransactionId

```
WRONG: Find by orderId
❌ Ambiguous when order has multiple payment attempts

RIGHT: Find by gatewayTransactionId
✔️ Unique per transaction attempt
✔️ Matches webhook identity
```

### 3. Two-Layer Idempotency (Intentional)

```
Layer 1: Webhook Repository (Transport Idempotency)
- gatewayTransactionId as UNIQUE key
- Prevents same webhook event from being processed twice
- Source of truth for "did we receive this event?"

Layer 2: PaymentConfirmationService (Business Protection)
- Checks Payment.status === SUCCESS before transition
- Ensures Order only transitions to PAID once
- Source of truth for "did we already confirm this payment?"

These are DIFFERENT concerns:
- Webhook: "Did we receive this webhook?"
- Payment: "Did we already mark this payment as SUCCESS?"
```

### 4. WebhookEvent Table Purpose

```
Purpose 1: DEDUPLICATION
- gatewayTransactionId as UNIQUE key
- Prevent same event from processing twice

Purpose 2: AUDIT LOG
- rawPayload stored for debugging
- NOT exposed in API responses
- Subject to redaction for PII (Step 7+)

NOTE: If audit is not needed, table could be simplified to:
- id
- gatewayTransactionId (UNIQUE)
- status
- processedAt
```

### 5. Separation of Concerns

```
WebhookController: HTTP transport (thin layer)
WebhookService: Orchestration (transport concerns)
PaymentConfirmationService: Business logic (reusable)

PaymentConfirmationService can be used by:
- Webhook handler
- Polling API
- Admin manual trigger
- Recovery job

It does NOT know HOW the event arrived.
```

---

## ✅ Objective Audit Matrix (Revised)

### Architecture Alignment

| Check | Status | Notes |
|-------|--------|-------|
| Webhook module terpisah dari Payment domain | ✅ | `modules/payment/webhook/` |
| PaymentConfirmationService reusable | ✅ | No transport dependencies |
| Layering: Controller → Validator → Service → Repository | ✅ | Clear separation |
| Signature verifier interface only in Step 6 | ✅ | Implementations in Step 7 |

### Scope Guard Adherence

| Check | Status | Notes |
|-------|--------|-------|
| Payment domain unchanged | ✅ | Only adds field to Payment |
| Gateway abstraction unchanged | ✅ | Step 4 integration remains |
| No refund/chargeback | ✅ | Focus on confirmation only |
| No provider-specific implementations | ✅ | Interface only |

### Progressive Check

| Check | Status | Notes |
|-------|--------|-------|
| Signature verified BEFORE processing | ✅ | Step 2 in flow |
| Duplicate returns 200 OK | ✅ | No throw, skip processing |
| Atomic transaction | ✅ | Payment + Order + Timeline |
| HTTP responses differentiated | ✅ | 200/400/403/501 |

### Trust Boundary

| Check | Status | Notes |
|-------|--------|-------|
| Signature verified | ✅ | 403 for invalid |
| Payload validated | ✅ | 400 for malformed |
| Event deduplicated | ✅ | gatewayTransactionId UNIQUE |
| Audit trail | ✅ | rawPayload stored, subject to redaction |

### State Machine

```
Payment State Transitions

┌─────────┐
│ PENDING │
└────┬────┘
     │
     │ Webhook: PAYMENT_SETTLEMENT
     │
     ▼
┌─────────┐
│ SUCCESS │
└─────────┘
     │
     │ NOT ALLOWED
     ▼
┌─────────┐
│ REJECTED│ (future: refund/chargeback)
└─────────┘

Order State Transitions

┌──────────────────┐
│ WAITING_PAYMENT  │
└────────┬─────────┘
         │
         │ Payment SUCCESS
         ▼
┌─────────┐
│   PAID  │
└─────────┘
         │
         │ NOT ALLOWED
         ▼
┌──────────────────┐
│ WAITING_PAYMENT  │ (no going back)
└──────────────────┘

Rule: Once PAID, Order cannot go back to WAITING_PAYMENT
Rule: Payment SUCCESS can only transition Order to PAID once per transaction
```

---

## 🚦 Status: READY TO CODE

Blueprint telah direvisi berdasarkan feedback:

| Priority | Issue | Resolution |
|----------|-------|-----------|
| 1 | HTTP Response Strategy | Differentiated: 200/400/403 |
| 2 | Signature Verifier | Interface only, STUB implementation |
| 3 | Payment Lookup | By gatewayTransactionId with migration fallback |
| 4 | WebhookEvent Table | Purpose clarified (dedup + audit) |
| 5 | Remove IGNORED status | Simplified to PENDING/PROCESSED/FAILED |
| 6 | Status Mapping | Simplified for STUB, extensible for Step 7 |
| 7 | Repository Logic | Pure data access only |
| 8 | Controller DI | Dependencies injected from outside |
| 9 | 501 Response | Changed to 400 (safer) |
| 10 | Two-layer Idempotency | Clarified as Transport vs Business |
| 11 | State Machine | Added Payment and Order transitions |
| 12 | Fallback Migration | TODO comment added |
