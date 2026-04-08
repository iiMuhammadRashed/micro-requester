/**
 * Error metadata for mapping and logging
 */
export interface RequestErrorMeta {
  service: string;
  method: string;
  path: string;
  requestId: string | undefined;
  attempt: number;
  upstreamStatus?: number;
  upstreamBody?: string;
}

/**
 * Try to get NestJS exceptions, fall back to Error subclasses if not available
 */
function getNestJsException() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@nestjs/common');
  } catch {
    return null;
  }
}

/**
 * Map transport-level error to appropriate HTTP exception
 */
export function mapTransportError(
  error: Error,
  meta: RequestErrorMeta
): Error {
  const nest = getNestJsException();
  const errorCode = (error as NodeJS.ErrnoException).code;
  const statusCode = getStatusForTransportError(errorCode, error.name);
  const message = formatErrorMessage(
    'Transport error',
    statusCode,
    meta,
    error.message
  );

  if (nest) {
    switch (statusCode) {
      case 503:
        return new nest.ServiceUnavailableException(message);
      case 504:
        return new nest.GatewayTimeoutException(message);
      case 502:
      default:
        return new nest.BadGatewayException(message);
    }
  }

  // Fallback: create Error subclass mimicking NestJS exceptions
  const err = new Error(message) as any;
  err.statusCode = statusCode;
  err.response = {
    statusCode,
    message,
    error: error.name,
  };
  return err;
}

/**
 * Map upstream HTTP error response to exception
 */
export function mapUpstreamError(
  statusCode: number,
  body: string | undefined,
  meta: RequestErrorMeta
): Error {
  const nest = getNestJsException();

  // 4xx errors: pass through as-is
  if (statusCode < 500) {
    const message = formatErrorMessage(
      `HTTP ${statusCode}`,
      statusCode,
      meta,
      body
    );

    if (nest) {
      return new nest.HttpException(message, statusCode);
    }

    const err = new Error(message) as any;
    err.statusCode = statusCode;
    err.response = {
      statusCode,
      message,
      error: 'Upstream Error',
    };
    if (body) {
      err.response.body = body;
    }
    return err;
  }

  // 5xx errors: normalize to 502 Bad Gateway
  const message = formatErrorMessage(
    `Upstream error (${statusCode})`,
    502,
    meta,
    body
  );

  if (nest) {
    return new nest.BadGatewayException(message);
  }

  const err = new Error(message) as any;
  err.statusCode = 502;
  err.response = {
    statusCode: 502,
    message,
    error: 'Bad Gateway',
    upstreamStatus: statusCode,
  };
  if (body) {
    err.response.upstreamBody = truncateBody(body);
  }
  return err;
}

/**
 * Determine HTTP status code from transport error code
 */
function getStatusForTransportError(
  errorCode: string | undefined,
  errorName: string
): number {
  if (errorCode === 'ECONNREFUSED') {
    return 503; // Service Unavailable
  }
  if (errorCode === 'ETIMEDOUT' || errorCode === 'UND_ERR_CONNECT_TIMEOUT') {
    return 504; // Gateway Timeout
  }
  if (errorCode === 'ENOTFOUND') {
    return 502; // Bad Gateway
  }
  if (errorCode === 'UND_ERR_SOCKET') {
    return 502; // Bad Gateway
  }
  if (errorName === 'AbortError') {
    return 504; // Gateway Timeout (likely request timeout)
  }
  return 502; // Default to Bad Gateway
}

/**
 * Format error message with metadata
 */
function formatErrorMessage(
  prefix: string,
  statusCode: number,
  meta: RequestErrorMeta,
  detail?: string
): string {
  const parts = [
    `${prefix} (${statusCode})`,
    `service: ${meta.service}`,
    `method: ${meta.method}`,
    `path: ${meta.path}`,
    `attempt: ${meta.attempt + 1}`,
  ];

  if (meta.requestId) {
    parts.push(`requestId: ${meta.requestId}`);
  }

  if (detail && detail.length > 0) {
    const truncated = truncateBody(detail);
    parts.push(`details: ${truncated}`);
  }

  return parts.join(' | ');
}

/**
 * Truncate string to 500 characters for safe logging
 */
function truncateBody(body: string): string {
  const limit = 500;
  return body.length > limit ? body.substring(0, limit) + '...' : body;
}
