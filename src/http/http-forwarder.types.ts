/**
 * HTTP request input configuration
 *
 * This shape is used by `client.req()` for full control, and by convenience methods
 * (`get`, `post`, etc.) through `opts`.
 */
export interface ReqInput {
  /**
   * HTTP method used for the request.
   *
   * Retries are only attempted for methods configured as retryable in `RetryPolicy`
   * (defaults are idempotent methods).
   */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  /**
   * URL path relative to client `base`.
   *
   * Examples: `/users`, `users/123`, `/v1/orders`.
   */
  path: string;
  /**
   * Optional query string parameters.
   *
   * `undefined` values are ignored.
   */
  query?: Record<string, string | number | boolean | undefined>;
  /**
   * Per-request headers.
   *
   * Merged over `defaultHeaders` so request-level values win on conflicts.
   */
  headers?: Record<string, string>;
  /**
   * Request body.
   *
   * If the value is not a string, it is serialized as JSON.
   * If `content-type` is missing in merged headers, `application/json` is added automatically.
   */
  body?: unknown;
  /**
   * Per-request timeout in milliseconds.
   *
   * Overrides `HttpClientOptions.timeoutMs` for this request only.
   */
  timeoutMs?: number;
  /**
   * Retry override for this request.
   *
   * - `false`: disable retries
   * - `number`: max retries for this request
   */
  retry?: false | number;
}

/**
 * Retry policy configuration
 *
 * Used to decide if and when retry attempts are executed.
 * @default DEFAULT_RETRY_POLICY
 */
export interface RetryPolicy {
  /** Methods eligible for retry (must be idempotent) */
  retryableMethods: string[];
  /** HTTP status codes that trigger retry */
  retryableStatuses: number[];
  /** Transport error codes that trigger retry */
  retryableErrors: string[];
  /** Initial backoff delay in milliseconds */
  baseDelayMs: number;
  /** Maximum backoff delay in milliseconds */
  maxDelayMs: number;
  /** Random jitter to add to backoff (milliseconds) */
  jitterMs: number;
}

/**
 * Lifecycle event payload for hooks
 *
 * All durations are measured in milliseconds.
 */
export interface HookPayload {
  /** Service name from client options */
  service: string;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Request ID (correlation header value or generated UUID) */
  requestId: string | undefined;
  /** Current attempt number (0-based) */
  attempt: number;
  /** Time elapsed for this attempt (milliseconds) */
  durationMs: number;
  /** HTTP status code (if response received) */
  statusCode?: number;
  /** Transport error (if request failed before response) */
  error?: Error;
}

/**
 * Lifecycle hooks - all errors are safely suppressed
 *
 * Hook exceptions never break request execution; they are swallowed by the client.
 */
export interface HttpClientHooks {
  /** Called before first attempt */
  onRequestStart?(payload: HookPayload): void;
  /** Called before retry sleep (only if retrying) */
  onRequestRetry?(payload: HookPayload): void;
  /** Called after successful response (2xx status) */
  onRequestSuccess?(payload: HookPayload): void;
  /** Called after final failure (no more retries) */
  onRequestFailure?(payload: HookPayload): void;
}

/**
 * Logger interface for optional structured logging
 */
export interface HttpClientLogger {
  /** Log info-level message */
  info(message: string, meta?: Record<string, unknown>): void;
  /** Log warn-level message */
  warn(message: string, meta?: Record<string, unknown>): void;
  /** Log error-level message */
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * HTTP client initialization options
 *
 * Create a single client instance per upstream service and reuse it.
 */
export interface HttpClientOptions {
  /** Service name (used in logs and error metadata) */
  service: string;
  /** Base URL for this service (e.g. "http://localhost:3001") */
  base: string;
  /** Default request timeout in milliseconds (default: 5000) */
  timeoutMs?: number;
  /** Default number of retries (default: 2) */
  retries?: number;
  /** Retry policy configuration (default: DEFAULT_RETRY_POLICY) */
  retryPolicy?: RetryPolicy;
  /** Headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  /** Function to resolve request ID for correlation (e.g., from AsyncLocalStorage) */
  getReqId?: () => string | undefined;
  /** Optional logger instance */
  logger?: HttpClientLogger;
  /** Optional lifecycle hooks */
  hooks?: Partial<HttpClientHooks>;
}

/**
 * Public HTTP client interface
 *
 * Use convenience methods for common verbs, or `req` for full control.
 */
export interface HttpClient {
  /**
   * Generic request with full control over all fields.
   */
  req<T = unknown>(input: ReqInput): Promise<T>;
  /** GET request */
  get<T = unknown>(
    path: string,
    opts?: Omit<ReqInput, 'method' | 'path'>
  ): Promise<T>;
  /** POST request */
  post<T = unknown>(
    path: string,
    opts?: Omit<ReqInput, 'method' | 'path'>
  ): Promise<T>;
  /** PUT request */
  put<T = unknown>(
    path: string,
    opts?: Omit<ReqInput, 'method' | 'path'>
  ): Promise<T>;
  /** PATCH request */
  patch<T = unknown>(
    path: string,
    opts?: Omit<ReqInput, 'method' | 'path'>
  ): Promise<T>;
  /** DELETE request */
  delete<T = unknown>(
    path: string,
    opts?: Omit<ReqInput, 'method' | 'path'>
  ): Promise<T>;
  /** HEAD request */
  head<T = unknown>(
    path: string,
    opts?: Omit<ReqInput, 'method' | 'path'>
  ): Promise<T>;
  /** OPTIONS request */
  options<T = unknown>(
    path: string,
    opts?: Omit<ReqInput, 'method' | 'path'>
  ): Promise<T>;
}
