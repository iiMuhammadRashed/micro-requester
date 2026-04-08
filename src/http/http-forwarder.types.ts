/**
 * HTTP request input configuration
 */
export interface ReqInput {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  /** URL path (relative to client base URL) */
  path: string;
  /** Query string parameters */
  query?: Record<string, string | number | boolean | undefined>;
  /** Custom headers (merged with client defaults) */
  headers?: Record<string, string>;
  /** Request body (for methods that support it) */
  body?: unknown;
  /** Request timeout in milliseconds (overrides client default) */
  timeoutMs?: number;
  /** Retry override: false = never retry, number = max retries for this request */
  retry?: false | number;
}

/**
 * Retry policy configuration
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
 */
export interface HttpClient {
  /** Generic request with full control */
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
}
