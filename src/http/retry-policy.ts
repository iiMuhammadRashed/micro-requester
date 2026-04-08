import type { RetryPolicy } from './http-forwarder.types.js';

/**
 * Default retry policy for HTTP requests
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  // Only idempotent methods can be safely retried
  retryableMethods: ['GET', 'HEAD', 'OPTIONS'],
  // 502, 503, 504 are transient service issues
  retryableStatuses: [502, 503, 504],
  // Transport and connection errors indicate transient failures
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_SOCKET',
  ],
  // Exponential backoff parameters
  baseDelayMs: 100,
  maxDelayMs: 1500,
  jitterMs: 50,
};

/**
 * Determine whether a request should be retried
 * Decision rules (in order):
 * 1. If retryOverride === false -> never retry
 * 2. If attempts exhausted -> stop
 * 3. If method not retryable -> stop
 * 4. If statusCode exists and not retryable -> stop
 * 5. If error code is retryable -> retry
 * 6. If statusCode is retryable -> retry
 * 7. Otherwise -> stop
 */
export function shouldRetry(params: {
  method: string;
  attempt: number;
  maxRetries: number;
  error?: Error;
  statusCode?: number;
  policy: RetryPolicy;
  retryOverride?: false | number;
}): boolean {
  const {
    method,
    attempt,
    maxRetries,
    error,
    statusCode,
    policy,
    retryOverride,
  } = params;

  // Rule 1: retryOverride === false disables all retries
  if (retryOverride === false) {
    return false;
  }

  // Rule 2: Check attempt limit
  const limit = retryOverride !== undefined ? retryOverride : maxRetries;
  if (attempt >= limit) {
    return false;
  }

  // Rule 3: Check if method is retryable
  if (!policy.retryableMethods.includes(method)) {
    return false;
  }

  // Rule 4: If we have a status code, it must be in retryable list
  if (statusCode !== undefined) {
    if (!policy.retryableStatuses.includes(statusCode)) {
      return false;
    }
    // Status is retryable, so retry
    return true;
  }

  // Rule 5: If we have an error, check if it's retryable
  if (error) {
    const errorCode = (error as NodeJS.ErrnoException).code;
    if (errorCode && policy.retryableErrors.includes(errorCode)) {
      return true;
    }
    // Check for AbortError (timeout)
    if (error.name === 'AbortError') {
      return true;
    }
  }

  // Rule 7: Default is to not retry
  return false;
}
