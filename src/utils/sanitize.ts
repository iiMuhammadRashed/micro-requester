/**
 * Sensitive header names that should be redacted in logs
 */
const SENSITIVE = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
]);

/**
 * Sanitize headers by redacting sensitive values before logging
 * @param headers - header object
 * @returns new object with sensitive values redacted
 */
export function sanitizeHeaders(
  headers: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [
      k,
      SENSITIVE.has(k.toLowerCase()) ? '[REDACTED]' : v,
    ])
  );
}
