import type { HttpClientHooks, HttpClientLogger, HookPayload } from './http-forwarder.types.js';

/**
 * Safely execute a hook function, suppressing errors
 * Never allow hook errors to break the request flow
 */
export function safeRunHook(
  hookName: string,
  hookFn: (() => void) | undefined,
  logger: HttpClientLogger | undefined
): void {
  if (!hookFn) {
    return;
  }

  try {
    hookFn();
  } catch (err) {
    // Suppress hook errors but log them if logger is available
    const errorMsg =
      err instanceof Error ? err.message : String(err);
    logger?.warn(
      `[micro-requester] hook "${hookName}" threw and was suppressed`,
      {
        error: errorMsg,
      }
    );
  }
}

/**
 * Emit onRequestStart hook
 */
export function emitRequestStart(
  hooks: Partial<HttpClientHooks> | undefined,
  logger: HttpClientLogger | undefined,
  payload: HookPayload
): void {
  safeRunHook(
    'onRequestStart',
    hooks?.onRequestStart ? () => hooks.onRequestStart!(payload) : undefined,
    logger
  );
}

/**
 * Emit onRequestRetry hook
 */
export function emitRequestRetry(
  hooks: Partial<HttpClientHooks> | undefined,
  logger: HttpClientLogger | undefined,
  payload: HookPayload
): void {
  safeRunHook(
    'onRequestRetry',
    hooks?.onRequestRetry ? () => hooks.onRequestRetry!(payload) : undefined,
    logger
  );
}

/**
 * Emit onRequestSuccess hook
 */
export function emitRequestSuccess(
  hooks: Partial<HttpClientHooks> | undefined,
  logger: HttpClientLogger | undefined,
  payload: HookPayload
): void {
  safeRunHook(
    'onRequestSuccess',
    hooks?.onRequestSuccess ? () => hooks.onRequestSuccess!(payload) : undefined,
    logger
  );
}

/**
 * Emit onRequestFailure hook
 */
export function emitRequestFailure(
  hooks: Partial<HttpClientHooks> | undefined,
  logger: HttpClientLogger | undefined,
  payload: HookPayload
): void {
  safeRunHook(
    'onRequestFailure',
    hooks?.onRequestFailure ? () => hooks.onRequestFailure!(payload) : undefined,
    logger
  );
}
