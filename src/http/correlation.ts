import { randomUUID } from 'node:crypto';

/**
 * Header name for request correlation ID
 */
export const CORRELATION_HEADER = 'x-request-id';

/**
 * Resolve request ID for correlation
 * Uses provided function or generates a new UUID
 * Integration point for AsyncLocalStorage in NestJS
 * @param getReqId - optional function to retrieve request ID
 * @returns request ID string
 */
export function resolveRequestId(
  getReqId?: () => string | undefined
): string {
  return getReqId?.() ?? randomUUID();
}

/**
 * Inject correlation header into request headers
 * Never mutates the original headers object
 * @param headers - existing headers object
 * @param requestId - request ID value
 * @returns new headers object with correlation header
 */
export function injectCorrelationHeader(
  headers: Record<string, string>,
  requestId: string
): Record<string, string> {
  return {
    ...headers,
    [CORRELATION_HEADER]: requestId,
  };
}
