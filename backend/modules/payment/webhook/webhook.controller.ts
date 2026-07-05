// ============================================================
// WEBHOOK CONTROLLER
// Phase 5 Step 6: HTTP Endpoint
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
        console.warn('Webhook validation error:', error);
        res.status(err.statusCode).json({ error: err.message });
        return;
      }

      // Unexpected error — return 200 to stop retry, log internally
      console.error('Webhook unexpected error:', error);
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
      transactionId: (body.transactionId ?? body.transaction_id) as string,
      orderId: (body.orderId ?? body.order_id) as string,
      status: (body.status ?? '') as string,
      amount: parseInt(
        (body.amount ?? body.gross_amount ?? '0') as string,
        10,
      ),
      currency: (body.currency ?? 'IDR') as string,
      timestamp: (body.timestamp ?? body.transaction_time ?? new Date().toISOString()) as string,
      signature: req.headers['x-signature'] as string | undefined,
    };
  }
}
