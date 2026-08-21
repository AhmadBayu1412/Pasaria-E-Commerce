// ============================================================
// HTTP CLIENT
// Phase 5 Step 7: Base HTTP Abstraction
//
// Philosophy:
// - Wrapper around fetch dengan timeout
// - Never expose raw fetch to gateway adapters
// - Semua HTTP concerns centralized di sini
// - Architecture Note: HttpClient adalah Transport ONLY
//   - Tidak ada auth, retry, circuit breaker, cache
//   - Hanya timeout, JSON parse, error mapping
// ============================================================

export interface HttpClientOptions {
  readonly baseUrl: string;
  readonly timeoutMs?: number;
  readonly headers?: Record<string, string>;
}

export interface HttpRequest {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly path: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
}

export interface HttpResponse<T> {
  readonly status: number;
  readonly data: T | undefined; // undefined untuk 204 No Content
  readonly headers: Record<string, string>;
}

export class HttpClientError extends Error {
  public readonly isRetryable: boolean;
  public readonly status?: number;
  public readonly retryAfterMs?: number;

  constructor(
    message: string,
    isRetryable: boolean,
    status?: number,
    retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'HttpClientError';
    this.isRetryable = isRetryable;
    this.status = status;
    this.retryAfterMs = retryAfterMs;

    Object.setPrototypeOf(this, HttpClientError.prototype);
  }

  static timeout(): HttpClientError {
    return new HttpClientError('Request timeout', true);
  }

  static networkError(cause: unknown): HttpClientError {
    return new HttpClientError(`Network error: ${cause}`, true);
  }

  static unauthorized(): HttpClientError {
    return new HttpClientError('Unauthorized', false, 401);
  }

  static badRequest(message: string): HttpClientError {
    return new HttpClientError(message, false, 400);
  }

  static serverError(message: string, retryAfterMs?: number): HttpClientError {
    return new HttpClientError(message, true, 500, retryAfterMs);
  }
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: HttpClientOptions) {
    if (!options.baseUrl) {
      throw new Error('HttpClient requires baseUrl');
    }
    this.baseUrl = options.baseUrl;
    this.defaultTimeout = options.timeoutMs ?? 10_000;
    this.defaultHeaders = options.headers ?? {};
  }

  async request<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.defaultTimeout,
    );

    try {
      const url = this.buildUrl(request.path);
      const headers = {
        ...this.defaultHeaders,
        'Content-Type': 'application/json',
        ...request.headers,
      };

      const response = await fetch(url, {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await this.parseResponse<T>(response);
      const retryAfterMs = this.parseRetryAfter(response.headers);

      return {
        status: response.status,
        data,
        headers: this.extractHeaders(response),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.mapError(error);
    }
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${this.baseUrl}${path}`;
  }

  /**
   * Parse response body
   * Handle 204 No Content
   */
  private async parseResponse<T>(response: Response): Promise<T | undefined> {
    // 204 No Content - tidak ada body
    if (response.status === 204) {
      return undefined;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }

  /**
   * Parse Retry-After header
   * Format:
   * - "120" = seconds
   * - "Mon, 01 Jan 2024 00:00:00 GMT" = HTTP-date
   */
  private parseRetryAfter(headers: Headers): number | undefined {
    const value = headers.get('Retry-After');
    if (!value) return undefined;

    // Try parse as seconds first
    const seconds = parseInt(value, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000; // Convert to milliseconds
    }

    // Try parse as HTTP-date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return Math.max(0, date.getTime() - Date.now());
    }

    return undefined;
  }

  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  private mapError(error: unknown): HttpClientError {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return HttpClientError.timeout();
      }
      return HttpClientError.networkError(error);
    }
    return HttpClientError.networkError('Unknown error');
  }
}
