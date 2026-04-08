type Meta = {
  service: string;
  method: string;
  path: string;
  attempt: number;
  requestId?: string;
};

function msg(prefix: string, meta: Meta, detail?: string): string {
  const parts = [
    prefix,
    meta.service,
    `${meta.method} ${meta.path}`,
    `attempt:${meta.attempt + 1}`,
  ];
  if (meta.requestId) {
    parts.push(`rid:${meta.requestId}`);
  }
  if (detail) {
    parts.push(detail.slice(0, 200));
  }
  return parts.join(' | ');
}

function nest() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@nestjs/common');
  } catch {
    return null;
  }
}

export function transportError(err: Error, meta: Meta): Error {
  const code = (err as NodeJS.ErrnoException).code;
  const status =
    code === 'ECONNREFUSED'
      ? 503
      : code === 'ETIMEDOUT' || err.name === 'AbortError' || code?.startsWith('UND_ERR')
      ? 504
      : 502;

  const message = msg(`Transport(${status})`, meta, err.message);
  const n = nest();

  if (n) {
    if (status === 503) {
      return new n.ServiceUnavailableException(message);
    }
    if (status === 504) {
      return new n.GatewayTimeoutException(message);
    }
    return new n.BadGatewayException(message);
  }

  return Object.assign(new Error(message), { statusCode: status });
}

export function upstreamError(statusCode: number, body: unknown, meta: Meta): Error {
  const n = nest();

  if (statusCode < 500) {
    const responseBody =
      typeof body === 'object' && body !== null
        ? body
        : { statusCode, message: body ?? `HTTP ${statusCode}` };

    if (n) {
      return new n.HttpException(responseBody, statusCode);
    }

    return Object.assign(new Error(`HTTP ${statusCode}`), {
      statusCode,
      response: responseBody,
    });
  }

  const message = msg(
    `Upstream(${statusCode})`,
    meta,
    typeof body === 'string' ? body : undefined
  );

  if (n) {
    return new n.BadGatewayException(message);
  }

  return Object.assign(new Error(message), { statusCode: 502 });
}
