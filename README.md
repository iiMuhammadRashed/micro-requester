# Micro Requester

> Professional HTTP client for microservice-to-microservice communication in Node.js and NestJS projects.

<div align="center">

[![npm version](https://img.shields.io/npm/v/micro-requester?style=flat-square&colorA=000000&colorB=24C881)](https://www.npmjs.com/package/micro-requester)
[![npm downloads](https://img.shields.io/npm/dm/micro-requester?style=flat-square&colorA=000000&colorB=24C881)](https://www.npmjs.com/package/micro-requester)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square&colorA=000000&colorB=24C881)](./LICENSE)
[![Node.js version](https://img.shields.io/badge/node-%3E%3D18-24C881?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3%2B-3178c6?style=flat-square)](https://www.typescriptlang.org/)

**Focused • Reliable • Small Surface Area • Production Ready**

</div>

---

## Why micro-requester?

`micro-requester` is intentionally focused on one job: reliable HTTP calls between services.

- One primary API: `createClient()`
- Preserves upstream `4xx` payloads (like `409 Conflict`) instead of masking them
- Normalizes transport failures into predictable gateway-style errors
- Built-in timeout and retry control with sensible defaults
- Works in plain Node.js and NestJS

If your project has custom middleware, tracing, or request context strategy, keep that in your app and pass `getReqId`.

---

## Installation

```bash
npm install micro-requester
```

Requirements: Node.js 18+

---

## Quick Start

```ts
import { createClient } from 'micro-requester';

const users = createClient({
  service: 'users-service',
  base: process.env.USERS_SERVICE_HTTP_URL || 'http://localhost:3001',
  timeoutMs: 5000,
  retries: 2,
  getReqId: () => requestContext.getStore()?.requestId, // optional
});

const user = await users.get('/users/1');

const created = await users.post('/users', {
  email: 'alice@example.com',
  name: 'Alice',
});
```

---

## API Reference

### `createClient(options)`

Creates a reusable client for one upstream service.

```ts
type ClientOptions = {
  service: string;
  base: string;
  timeoutMs?: number;
  retries?: number;
  retryStatuses?: number[];
  headers?: Record<string, string>;
  getReqId?: () => string | undefined;
};
```

Parameter details:

- `service`: service label used in mapped errors
- `base`: upstream base URL
- `timeoutMs`: default timeout per request (default `5000`)
- `retries`: default retry count (default `2`)
- `retryStatuses`: status codes considered retryable for idempotent methods (default `[502, 503, 504]`)
- `headers`: default headers merged into every request
- `getReqId`: optional request ID resolver; falls back to generated UUID

### `Client`

```ts
type Client = {
  req<T>(input: ReqInput): Promise<T>;
  get<T>(path: string, opts?: Partial<ReqInput>): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: Partial<ReqInput>): Promise<T>;
  put<T>(path: string, body?: unknown, opts?: Partial<ReqInput>): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: Partial<ReqInput>): Promise<T>;
  delete<T>(path: string, opts?: Partial<ReqInput>): Promise<T>;
};
```

### `ReqInput`

```ts
type ReqInput = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retry?: false | number;
};
```

Notes:

- If `body` is an object, it is JSON-stringified automatically.
- If `content-type` is missing for object body, `application/json` is set.
- `x-request-id` is always attached to outgoing requests.
- `req()` supports all methods in `ReqInput`, including `HEAD` and `OPTIONS`.

---

## Error Behavior

### Upstream responses

- `4xx` responses are passed through with original body/message
- `5xx` responses are normalized to `502 Bad Gateway`

### Transport failures

- `ECONNREFUSED` -> `503 Service Unavailable`
- timeout/abort/`UND_ERR*` -> `504 Gateway Timeout`
- other transport failures -> `502 Bad Gateway`

This behavior is designed to prevent business errors (for example duplicate email `409`) from being hidden by generic transport messages.

---

## Retry Model

Retries are conservative by default:

- Retryable methods: `GET`, `HEAD`, `OPTIONS`
- Retryable statuses: `502`, `503`, `504`
- Retryable transport errors: `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, `UND_ERR_CONNECT_TIMEOUT`, `UND_ERR_SOCKET`

Backoff:

- Exponential: `100 * 2^attempt`
- Jitter: up to `50ms`
- Max delay: `1500ms`

Override per request:

```ts
await users.get('/health', { retry: false });
await users.get('/health', { retry: 1 });
```

---

## NestJS Integration Example

```ts
import { Injectable } from '@nestjs/common';
import { createClient } from 'micro-requester';
import { requestContext } from './request-context.middleware';

@Injectable()
export class UsersClient {
  private readonly client = createClient({
    service: 'users-service',
    base: process.env.USERS_SERVICE_HTTP_URL || 'http://localhost:3001',
    timeoutMs: 5000,
    retries: 2,
    getReqId: () => requestContext.getStore()?.requestId,
  });

  getUser(id: string) {
    return this.client.get(`/users/${id}`);
  }

  createUser(body: unknown) {
    return this.client.post('/users', body);
  }
}
```

---

## Design Philosophy

- Keep package concerns inside HTTP execution and error mapping
- Keep project concerns (middleware/context/observability) inside your app
- Preserve upstream business errors by default

---

## License

MIT
