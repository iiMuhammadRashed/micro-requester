# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-04-08

### 💥 Changed

- Rewrote package to a minimal architecture centered on one core function: `createClient()`.
- Reduced source surface to three files: `src/index.ts`, `src/client.ts`, and `src/errors.ts`.

### 🧹 Removed

- Removed previous `src/http/*` and `src/utils/*` implementation layers.
- Removed extra abstractions not required for core microservice HTTP use case.

### ✅ Result

- Smaller, easier-to-read package focused on main problem only.
- Keeps retry, timeout, upstream 4xx pass-through, and transport error mapping.

## [0.2.0] - 2026-04-08

### 💥 Changed

- Simplified package architecture around a single primary entry point: `createClient()`.
- Consolidated retry, URL join, correlation header injection, hook dispatch, and backoff helpers into `create-client.ts` to reduce indirection.

### 🧹 Removed

- Removed package-provided request context/middleware helpers (`requestContextMiddleware`, `getRequestId`, `runWithRequestContext`).
- Removed `createAutoClient()` to avoid multiple integration paths.
- Removed low-level helper modules no longer needed after consolidation.

### ✅ Result

- Fewer files, less code surface, and project-owned middleware strategy.
- Core behavior remains focused on robust HTTP calls, retries, and correct upstream error propagation.

## [0.1.4] - 2026-04-08

### ➕ Added

- Added `createAutoClient()` for zero-boilerplate request-id wiring.
- Added built-in request context helpers: `requestContextMiddleware`, `getRequestId`, and `runWithRequestContext`.
- Added README section for install-and-use flow without custom request context files.

## [0.1.3] - 2026-04-08

### 🐛 Fixed

- Fixed upstream `4xx` NestJS exception pass-through detection so already-mapped errors are no longer wrapped as transport `502`.
- Fixed duplicate-user style conflict flow to preserve upstream `409` payload/message instead of returning wrapped `Bad Gateway` output.
- Fixed upstream error mapping to preserve structured JSON body fields (`message`, `error`, `statusCode`) for `4xx` responses.
- Improved retry status extraction by supporting `statusCode`, `response.statusCode`, and Nest `getStatus()` error shapes.

## [0.1.2] - 2026-04-08

### ✨ Improved

- Preserved upstream 4xx pass-through behavior by preventing double error remapping in request execution.
- Improved timeout classification to use AbortError semantics consistently.
- Expanded undici timeout code mapping for more accurate 504 Gateway Timeout responses.
- Added automatic application/json content-type when request body is JSON-like and header is not provided.
- Unified request ID usage across request lifecycle (hooks, retries, and outbound headers).
- Added sanitized outbound header logging for safer observability metadata.

### ➕ Added

- New convenience methods: head() and options().
- Expanded JSDoc documentation across public types and core request flow.
- README updates for dynamic request behavior and new method examples.

## [0.1.0] - 2026-04-08

### ✨ Added

#### Core Features
- **HTTP Client Factory** (`createClient`)
  - Service-to-service communication with full TypeScript support
  - Built on `undici` for optimal Node.js performance
  - Dual output: ESM and CommonJS with type definitions
  - Zero external dependencies beyond `undici`

#### Smart Retry Engine
- Exponential backoff with configurable jitter
- Method-aware retry logic (idempotent methods only)
- Configurable retryable error codes and status codes
- Per-request retry override capability
- Default safe configuration for production use

#### Request Correlation
- Automatic `x-request-id` header injection for tracing
- Integration with NestJS `AsyncLocalStorage` pattern
- Custom request ID resolver support via `getReqId` function
- End-to-end correlation across microservice boundaries

#### Request Lifecycle
- Global and per-request timeout configuration
- Per-request timeout override
- Configurable default headers
- Query string serialization with `URLSearchParams`

#### Error Mapping
- Transport errors → stable HTTP exceptions (502/503/504)
- Upstream 4xx errors → passed through unchanged
- Upstream 5xx errors → normalized to 502 Bad Gateway
- Full error metadata (service, method, path, requestId, attempt)
- Graceful fallback when NestJS is not installed

#### Response Parsing
- Automatic JSON parsing for `application/json` content-type
- 204 No Content handling (returns `undefined`)
- Empty body handling
- Invalid JSON detection on success responses
- Automatic fallback to raw string for non-JSON responses

#### Lifecycle Hooks
- Safe, fire-and-forget hook implementation
- Hook errors never affect request flow
- Four lifecycle events: `onRequestStart`, `onRequestRetry`, `onRequestSuccess`, `onRequestFailure`
- Performance metrics (`durationMs`) in all hook payloads
- Optional logging integration

#### Convenience Methods
- `get()`, `post()`, `put()`, `patch()`, `delete()`
- Generic `req()` method for full control
- All methods support full TypeScript generics

#### Utilities
- URL joining via `joinUrl()` — single canonical place for URL construction
- Header sanitization for safe logging — redacts sensitive headers
- Exponential backoff calculation with jitter
- Promise-based delay via `sleep()`

### 📦 Configuration

All defaults production-ready:
- Request timeout: 5000ms
- Retry attempts: 2
- Retryable methods: GET, HEAD, OPTIONS
- Retryable statuses: 502, 503, 504
- Exponential backoff: 100ms base, 1500ms max, 50ms jitter

### 📚 Documentation

- Complete README with badges and section links
- Quick start examples for common use cases
- Configuration reference with defaults
- Retry behavior documentation
- Error mapping reference table
- NestJS AsyncLocalStorage integration guide (4 steps)
- Lifecycle hooks examples
- API reference for all public types
- Troubleshooting section for common issues
- Environment variable patterns

### 🛠️ Build & Release

- TypeScript strict mode enabled
- Dual CJS + ESM compilation
- Type definitions with declaration maps
- Source maps included
- `prepublishOnly` script for safe publishing
- `.npmignore` to control package contents
- `.gitignore` for development

---

## [Unreleased]

### 🚀 Planned for v0.2

- **Response Validation** — built-in `class-validator` integration
- **Circuit Breaker Pattern** — resilience against cascading failures
- **Event Bus Integration** — emit events on request lifecycle
- **Service Discovery** — dynamic routing via `service` field
- **Streaming Responses** — support for large payloads
- **Request/Response Interceptors** — middleware-style hooks

### 💡 Under Consideration

- Built-in metrics collection (timing, error rates)
- Connection pooling configuration
- Bulk request utilities
- GraphQL support
- HTTP/2 support (when undici enables it)

---

## Support

- **Issues:** [GitHub Issues](https://github.com/iiMuhammadRashed/micro-requester/issues)
- **Repository:** [GitHub](https://github.com/iiMuhammadRashed/micro-requester)
- **Documentation:** [README.md](./README.md)

## Security

If you discover a security vulnerability, please open an issue on [GitHub Issues](https://github.com/iiMuhammadRashed/micro-requester/issues/security).

## License

See [LICENSE](./LICENSE) for details.
