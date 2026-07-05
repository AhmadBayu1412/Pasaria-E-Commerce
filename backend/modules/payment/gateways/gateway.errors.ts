// ============================================================
// GATEWAY ERRORS
// Phase 5 Step 4: Gateway Abstraction
//
// Philosophy:
// - All provider errors TRANSLATED to domain error
// - Semantic error types (NETWORK_ERROR, AUTH_ERROR, etc.)
// - isRetryable flag for retry decision making
// - originalError for internal debugging only
// ============================================================

export type GatewayErrorType =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'AUTH_ERROR'
  | 'INVALID_REQUEST'
  | 'PROVIDER_ERROR';

export class PaymentGatewayError extends Error {
  public readonly type: GatewayErrorType;
  public readonly isRetryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    type: GatewayErrorType,
    isRetryable: boolean,
    options?: {
      originalError?: unknown;
    },
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
    this.type = type;
    this.isRetryable = isRetryable;
    this.originalError = options?.originalError;

    Object.setPrototypeOf(this, PaymentGatewayError.prototype);
  }

  static networkError(
    message: string,
    originalError?: unknown,
  ): PaymentGatewayError {
    return new PaymentGatewayError(message, 'NETWORK_ERROR', true, {
      originalError,
    });
  }

  static timeoutError(
    message: string,
    originalError?: unknown,
  ): PaymentGatewayError {
    return new PaymentGatewayError(message, 'TIMEOUT_ERROR', true, {
      originalError,
    });
  }

  static authError(
    message: string,
    originalError?: unknown,
  ): PaymentGatewayError {
    return new PaymentGatewayError(message, 'AUTH_ERROR', false, {
      originalError,
    });
  }

  static invalidRequest(message: string): PaymentGatewayError {
    return new PaymentGatewayError(message, 'INVALID_REQUEST', false);
  }

  static providerError(
    message: string,
    originalError?: unknown,
  ): PaymentGatewayError {
    return new PaymentGatewayError(message, 'PROVIDER_ERROR', true, {
      originalError,
    });
  }
}
