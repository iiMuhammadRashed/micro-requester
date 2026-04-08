import { fetch } from 'undici';
import type {
  HttpClient,
  HttpClientOptions,
  ReqInput,
  RetryPolicy,
} from './http-forwarder.types.js';
import { calcBackoff } from '../utils/backoff.js';
import { sleep } from '../utils/sleep.js';
import { joinUrl } from '../utils/url.js';
import { sanitizeHeaders } from '../utils/sanitize.js';
import {
  resolveRequestId,
  injectCorrelationHeader,
} from './correlation.js';
import { DEFAULT_RETRY_POLICY, shouldRetry } from './retry-policy.js';
import { mapTransportError, mapUpstreamError } from './error-mapper.js';
import {
  emitRequestStart,
  emitRequestRetry,
  emitRequestSuccess,
  emitRequestFailure,
} from './hooks.js';

/**
 * Resolved client options with all defaults applied
 */
interface ResolvedOptions extends HttpClientOptions {
  timeoutMs: number;
  retries: number;
  retryPolicy: RetryPolicy;
}

/**
 * Response from internal request executor
 */
interface RequestResult {
  statusCode: number;
  body: unknown;
}

/**
 * Create an HTTP client for service-to-service communication
 */
export function createClient(options: HttpClientOptions): HttpClient {
  // Apply defaults
  const resolved: ResolvedOptions = {
    ...options,
    timeoutMs: options.timeoutMs ?? 5000,
    retries: options.retries ?? 2,
    retryPolicy: options.retryPolicy ?? DEFAULT_RETRY_POLICY,
  };

  /**
   * Execute a single request attempt
   */
  async function executeRequest(
    input: ReqInput,
    attempt: number
  ): Promise<RequestResult> {
    const startTime = performance.now();
    const requestId = resolveRequestId(resolved.getReqId);
    const timeoutMs = input.timeoutMs ?? resolved.timeoutMs;

    const payload = {
      service: resolved.service,
      method: input.method,
      path: input.path,
      requestId,
      attempt,
      durationMs: 0,
    };

    try {
      // Build full URL with query parameters
      let url = joinUrl(resolved.base, input.path);
      if (input.query) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(input.query)) {
          if (value !== undefined) {
            params.set(key, String(value));
          }
        }
        const queryStr = params.toString();
        if (queryStr) {
          url = `${url}?${queryStr}`;
        }
      }

      // Merge headers with correlation header
      let headers: Record<string, string> = {
        ...resolved.defaultHeaders,
        ...input.headers,
      };
      headers = injectCorrelationHeader(headers, requestId);

      // Create abort controller for timeout
      const abortController = new AbortController();
      const timeoutHandle = setTimeout(
        () => abortController.abort(),
        timeoutMs
      );

      try {
        // Make the request
        const response = await fetch(url, {
          method: input.method,
          headers,
          body:
            input.body !== undefined
              ? typeof input.body === 'string'
                ? input.body
                : JSON.stringify(input.body)
              : undefined,
          signal: abortController.signal,
        });

        const statusCode = response.status;
        const contentType = response.headers.get('content-type');
        let body: unknown;

        // Parse response body
        if (statusCode === 204 || !response.body) {
          // 204 No Content or empty body
          body = undefined;
        } else if (contentType?.includes('application/json')) {
          const text = await response.text();
          if (text) {
            try {
              body = JSON.parse(text);
            } catch {
              // JSON parse error on 2xx status -> bad gateway
              if (statusCode >= 200 && statusCode < 300) {
                throw mapUpstreamError(502, text, {
                  ...payload,
                  upstreamStatus: statusCode,
                });
              }
              body = text;
            }
          } else {
            body = undefined;
          }
        } else {
          // Non-JSON or text content
          body = await response.text();
        }

        // Check for non-2xx status
        if (statusCode < 200 || statusCode >= 300) {
          const bodyStr = typeof body === 'string' ? body : undefined;
          throw mapUpstreamError(statusCode, bodyStr, {
            ...payload,
            upstreamStatus: statusCode,
          });
        }

        return { statusCode, body };
      } finally {
        clearTimeout(timeoutHandle);
      }
    } catch (err) {
      const durationMs = performance.now() - startTime;
      payload.durationMs = durationMs;

      if (err instanceof Error && err.message === 'AbortError') {
        throw mapTransportError(new Error('Request timeout'), {
          ...payload,
        });
      }

      if (err instanceof Error && err instanceof AggregateError) {
        // Handle aggregate errors from fetch
        const firstErr = err.errors?.[0];
        if (firstErr instanceof Error) {
          throw mapTransportError(firstErr, {
            ...payload,
          });
        }
      }

      if (err instanceof Error) {
        throw mapTransportError(err, {
          ...payload,
        });
      }

      throw err;
    }
  }

  /**
   * Core request method with retry loop
   */
  async function req<T = unknown>(input: ReqInput): Promise<T> {
    const requestId = resolveRequestId(resolved.getReqId);
    const maxRetries =
      input.retry !== undefined ? (input.retry === false ? 0 : input.retry) : resolved.retries;

    const basePayload = {
      service: resolved.service,
      method: input.method,
      path: input.path,
      requestId,
    };

    let attempt = 0;
    let lastError: Error | undefined;

    // First attempt hook
    emitRequestStart(resolved.hooks, resolved.logger, {
      ...basePayload,
      attempt: 0,
      durationMs: 0,
    });

    while (true) {
      const startTime = performance.now();

      try {
        const result = await executeRequest(input, attempt);
        const durationMs = performance.now() - startTime;

        emitRequestSuccess(resolved.hooks, resolved.logger, {
          ...basePayload,
          attempt,
          durationMs,
          statusCode: result.statusCode,
        });

        return result.body as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const durationMs = performance.now() - startTime;
        const statusCode = (err as any)?.response?.statusCode;

        // Check if we should retry
        if (
          shouldRetry({
            method: input.method,
            attempt,
            maxRetries,
            error: lastError,
            statusCode,
            policy: resolved.retryPolicy,
            retryOverride: input.retry,
          })
        ) {
          emitRequestRetry(resolved.hooks, resolved.logger, {
            ...basePayload,
            attempt,
            durationMs,
            statusCode,
            error: lastError,
          });

          const backoffMs = calcBackoff(attempt, resolved.retryPolicy);
          await sleep(backoffMs);
          attempt++;
          continue;
        }

        // No more retries
        emitRequestFailure(resolved.hooks, resolved.logger, {
          ...basePayload,
          attempt,
          durationMs,
          statusCode,
          error: lastError,
        });

        throw lastError;
      }
    }
  }

  /**
   * Convenience methods
   */
  const client: HttpClient = {
    req,

    get<T = unknown>(
      path: string,
      opts?: Omit<ReqInput, 'method' | 'path'>
    ): Promise<T> {
      return req({ ...opts, method: 'GET', path });
    },

    post<T = unknown>(
      path: string,
      opts?: Omit<ReqInput, 'method' | 'path'>
    ): Promise<T> {
      return req({ ...opts, method: 'POST', path });
    },

    put<T = unknown>(
      path: string,
      opts?: Omit<ReqInput, 'method' | 'path'>
    ): Promise<T> {
      return req({ ...opts, method: 'PUT', path });
    },

    patch<T = unknown>(
      path: string,
      opts?: Omit<ReqInput, 'method' | 'path'>
    ): Promise<T> {
      return req({ ...opts, method: 'PATCH', path });
    },

    delete<T = unknown>(
      path: string,
      opts?: Omit<ReqInput, 'method' | 'path'>
    ): Promise<T> {
      return req({ ...opts, method: 'DELETE', path });
    },
  };

  return client;
}
