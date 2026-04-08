import { fetch } from 'undici';
import { randomUUID } from 'node:crypto';
import { transportError, upstreamError } from './errors.js';

export interface ClientOptions {
  service: string;
  base: string;
  timeoutMs?: number;
  retries?: number;
  retryStatuses?: number[];
  headers?: Record<string, string>;
  getReqId?: () => string | undefined;
}

export interface ReqInput {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retry?: false | number;
}

export type Client = {
  req<T>(input: ReqInput): Promise<T>;
  get<T>(path: string, opts?: Partial<ReqInput>): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: Partial<ReqInput>): Promise<T>;
  put<T>(path: string, body?: unknown, opts?: Partial<ReqInput>): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: Partial<ReqInput>): Promise<T>;
  delete<T>(path: string, opts?: Partial<ReqInput>): Promise<T>;
};

const RETRY_STATUSES = [502, 503, 504];
const RETRY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const RETRY_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);

export function createClient(options: ClientOptions): Client {
  const {
    service,
    timeoutMs = 5000,
    retries = 2,
    headers: defaultHeaders = {},
    getReqId,
  } = options;

  const base = options.base.replace(/\/$/, '');
  const retryStatuses = options.retryStatuses ?? RETRY_STATUSES;

  async function req<T>(input: ReqInput): Promise<T> {
    const requestId = getReqId?.() ?? randomUUID();
    const limit = input.retry === false ? 0 : (input.retry ?? retries);
    const meta: {
      service: string;
      method: string;
      path: string;
      attempt: number;
      requestId?: string;
    } = {
      service,
      method: input.method,
      path: input.path,
      attempt: 0,
      requestId,
    };

    for (let attempt = 0; attempt <= limit; attempt++) {
      meta.attempt = attempt;

      let url = `${base}${input.path.startsWith('/') ? '' : '/'}${input.path}`;
      if (input.query) {
        const qs = new URLSearchParams(
          Object.entries(input.query)
            .filter(([, value]) => value != null)
            .map(([key, value]) => [key, String(value)] as [string, string])
        ).toString();

        if (qs) {
          url += `?${qs}`;
        }
      }

      const headers: Record<string, string> = {
        ...defaultHeaders,
        ...input.headers,
        'x-request-id': requestId,
      };

      if (input.body !== undefined && typeof input.body !== 'string') {
        headers['content-type'] ??= 'application/json';
      }

      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), input.timeoutMs ?? timeoutMs);

      try {
        const res = await fetch(url, {
          method: input.method,
          headers,
          body:
            input.body == null
              ? undefined
              : typeof input.body === 'string'
              ? input.body
              : JSON.stringify(input.body),
          signal: ac.signal,
        });

        const status = res.status;
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const body =
          status === 204
            ? undefined
            : isJson
            ? await res.json().catch(() => res.text())
            : await res.text();

        if (status < 200 || status >= 300) {
          const err = upstreamError(status, body, meta);
          const canRetry =
            retryStatuses.includes(status) &&
            RETRY_METHODS.has(input.method) &&
            attempt < limit;

          if (canRetry) {
            await sleep(backoff(attempt));
            continue;
          }

          throw err;
        }

        return body as T;
      } catch (err) {
        if (isAlreadyMapped(err)) {
          throw err;
        }

        if (err instanceof Error) {
          const code = (err as NodeJS.ErrnoException).code;
          const canRetry =
            (RETRY_CODES.has(code ?? '') || err.name === 'AbortError') &&
            RETRY_METHODS.has(input.method) &&
            attempt < limit;

          if (canRetry) {
            await sleep(backoff(attempt));
            continue;
          }

          throw transportError(err, meta);
        }

        throw err;
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error('unreachable');
  }

  return {
    req,
    get: (path, opts) => req({ method: 'GET', path, ...(opts ?? {}) }),
    post: (path, body, opts) => req({ method: 'POST', path, body, ...(opts ?? {}) }),
    put: (path, body, opts) => req({ method: 'PUT', path, body, ...(opts ?? {}) }),
    patch: (path, body, opts) => req({ method: 'PATCH', path, body, ...(opts ?? {}) }),
    delete: (path, opts) => req({ method: 'DELETE', path, ...(opts ?? {}) }),
  };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const backoff = (attempt: number) => Math.min(100 * 2 ** attempt + Math.random() * 50, 1500);

function isAlreadyMapped(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }

  const e = err as { statusCode?: unknown; response?: { statusCode?: unknown }; getStatus?: () => unknown };
  const status = e.statusCode ?? e.response?.statusCode ?? e.getStatus?.();
  return typeof status === 'number';
}
