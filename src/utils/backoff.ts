import type { RetryPolicy } from '../http/http-forwarder.types.js';

/**
 * Calculate exponential backoff delay with jitter
 * @param attempt - current attempt number (0-based)
 * @param policy - retry policy configuration
 * @returns delay in milliseconds
 */
export function calcBackoff(attempt: number, policy: RetryPolicy): number {
  const exponential = policy.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * policy.jitterMs;
  return Math.min(exponential + jitter, policy.maxDelayMs);
}
