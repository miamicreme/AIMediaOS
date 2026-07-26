// Safety utilities for common patterns

export interface SafeOperationOptions {
  timeout?: number;
  maxRetries?: number;
  backoffMs?: number;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF_MS = 1000;

export class TimeoutError extends Error {
  constructor(message = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class RetryError extends Error {
  constructor(message = "Max retries exceeded") {
    super(message);
    this.name = "RetryError";
  }
}

export async function withSafeTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError()), timeoutMs)
    ),
  ]);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: SafeOperationOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await withSafeTimeout(fn(), timeout);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on timeout or validation errors
      if (lastError instanceof TimeoutError || lastError.message.includes("validation")) {
        throw lastError;
      }

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delayMs = backoffMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new RetryError();
}

export async function safeJobPoll<T>(
  pollFn: () => Promise<{ result?: T; complete: boolean }>,
  maxWaitMs: number = 300000 // 5 minutes
): Promise<T | null> {
  const startTime = Date.now();
  const pollIntervalMs = 500;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const { result, complete } = await withSafeTimeout(pollFn(), 10000);

      if (complete) {
        return result ?? null;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      // Log but continue polling on transient errors
      if (!(error instanceof TimeoutError)) {
        console.warn("Poll error:", error);
      }
    }
  }

  throw new TimeoutError(`Job polling exceeded max wait time (${maxWaitMs}ms)`);
}

export function validateInput<T>(
  value: unknown,
  validator: (v: unknown) => { valid: boolean; error?: string; value?: T }
): T {
  const result = validator(value);
  if (!result.valid) {
    throw new Error(result.error || "Validation failed");
  }
  return result.value as T;
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}
