// ============================================================
// WEBHOOK SERVICE
// Phase 5 Step 6: Orchestration
//
// Philosophy:
// - Orchestrates transport concerns only
// - Delegates business logic to PaymentConfirmationService
// - Handles HTTP response strategy
// - Structured logging for observability
//
// CRITICAL OBSERVABILITY NOTE:
// Returning 200 on processing errors is intentional to stop gateway retry.
// However, this MUST be accompanied by proper logging/alerting.
// The `shouldLog: true` flag signals the controller to log this event.
// In production, this should trigger:
// 1. Structured error logging (done here)
// 2. Metrics/alerting (external monitoring)
// 3. Recovery job for potentially lost payments (future enhancement)
// ============================================================

import { WebhookValidator } from './webhook.validator.js';
import { WebhookRepository } from './webhook.repository.js';
import { PaymentConfirmationService } from '../payment-confirmation.service.js';
import type {
  WebhookPayload,
  WebhookResponse,
  GatewayProvider,
} from './webhook.types.js';
import {
  WebhookMissingFieldError,
  WebhookPayloadError,
} from './webhook.errors.js';

// ============================================================
// STRUCTURED LOGGING
// ============================================================

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
} as const;

interface LogEntry {
  timestamp: string;
  level: keyof typeof LOG_LEVELS;
  event: string;
  provider: GatewayProvider;
  transactionId?: string;
  orderId?: string;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

function log(entry: LogEntry): void {
  const logLine = JSON.stringify(entry);
  if (entry.level === 'ERROR') {
    console.error(logLine);
  } else if (entry.level === 'WARN') {
    console.warn(logLine);
  } else {
    console.log(logLine);
  }
}

// ============================================================
// SERVICE
// ============================================================

export class WebhookService {
  constructor(
    private readonly validator: WebhookValidator,
    private readonly confirmationService: PaymentConfirmationService,
  ) {}

  /**
   * Process incoming webhook
   *
   * Flow:
   * 1. Validate payload format (throws → 400)
   * 2. Verify signature (returns VerificationResult)
   * 3. If invalid signature → 403
   * 4. Acquire event lock (atomic)
   * 5. If duplicate → 200 (already processed)
   * 6. Process confirmation
   * 7. Mark as processed → 200
   *
   * OBSERVABILITY:
   * - Every error is logged with structured format
   * - `shouldLog: true` signals controller to log the HTTP request
   * - Failed events are marked FAILED in database for audit/recovery
   *
   * NOTE: Returns WebhookResponse, controller sends appropriate HTTP status
   */
  async processWebhook(
    payload: WebhookPayload,
    provider: GatewayProvider,
  ): Promise<WebhookResponse> {
    // Step 1: Validate payload format
    try {
      this.validatePayload(payload);
    } catch (error) {
      log({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        event: 'WEBHOOK_VALIDATION_FAILED',
        provider,
        transactionId: payload.transactionId,
        orderId: payload.orderId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    // Step 2: Verify signature
    const verification = this.validator.verify(payload, provider);
    if (!verification.valid) {
      log({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        event: 'WEBHOOK_SIGNATURE_INVALID',
        provider,
        transactionId: payload.transactionId,
        orderId: payload.orderId,
        error: verification.error,
      });
      return {
        statusCode: 403,
        body: { error: 'Forbidden' },
        shouldLog: true,
      };
    }

    // Step 3: Try to acquire event (deduplication)
    const { acquired, existingEvent } =
      await WebhookRepository.acquireEvent(
        payload.transactionId,
        provider,
        this.extractEventType(payload.status),
        payload,
      );

    // Step 4: Handle duplicate
    if (!acquired && existingEvent) {
      log({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        event: 'WEBHOOK_DUPLICATE_SKIPPED',
        provider,
        transactionId: payload.transactionId,
        orderId: payload.orderId,
        existingEventStatus: existingEvent.status,
      });
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

      log({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        event: 'WEBHOOK_PROCESSED_SUCCESS',
        provider,
        transactionId: payload.transactionId,
        orderId: payload.orderId,
        paymentId: result.paymentId,
        idempotent: result.idempotent,
      });

      return {
        statusCode: 200,
        body: { received: true, processed: true },
        shouldLog: false,
      };
    } catch (error) {
      // CRITICAL: Return 200 to stop gateway retry
      // But log the error for observability and potential recovery
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      log({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        event: 'WEBHOOK_PROCESSING_FAILED',
        provider,
        transactionId: payload.transactionId,
        orderId: payload.orderId,
        error: errorMessage,
        stack: errorStack,
        // NOTE: Event is marked FAILED in DB for audit/recovery job
      });

      // Mark event as FAILED for audit trail
      // This enables a future recovery job to retry failed events
      await WebhookRepository.markFailed(
        payload.transactionId,
        errorMessage,
      ).catch(() => {
        // Best effort - don't fail the response
        log({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          event: 'WEBHOOK_DB_UPDATE_FAILED',
          provider,
          transactionId: payload.transactionId,
          error: 'Failed to mark webhook event as FAILED in database',
        });
      });

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
      throw new WebhookMissingFieldError('transactionId');
    }
    if (!payload.orderId) {
      throw new WebhookMissingFieldError('orderId');
    }
    if (!payload.status) {
      throw new WebhookMissingFieldError('status');
    }
    if (typeof payload.amount !== 'number' || payload.amount <= 0) {
      throw new WebhookPayloadError('Invalid amount');
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
      success: 'PAYMENT_SETTLEMENT',
      pending: 'PAYMENT_PENDING',
      expired: 'PAYMENT_EXPIRE',
      failed: 'PAYMENT_DENY',
    };

    return statusMap[status.toLowerCase()] ?? 'PAYMENT_PENDING';
  }

  /**
   * Handle already-existing event
   */
  private handleExistingEvent(
    event: { status: string },
  ): WebhookResponse {
    // Already processed or failed — return 200 to stop retry
    return {
      statusCode: 200,
      body: { received: true, alreadyProcessed: true },
      shouldLog: false,
    };
  }
}
