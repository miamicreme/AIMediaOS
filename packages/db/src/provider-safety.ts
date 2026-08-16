// Provider call safety and resilience patterns

export enum CircuitBreakerState {
  CLOSED = "CLOSED",     // Normal operation
  OPEN = "OPEN",         // Failing, reject requests
  HALF_OPEN = "HALF_OPEN", // Testing recovery
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Failures before opening
  successThreshold: number; // Successes to close from half-open
  timeout: number; // Timeout before attempting recovery
  windowSize: number; // Time window for counting failures
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  windowSize: 60000, // 1 minute
};

class CircuitBreaker {
  private state = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN - provider temporarily unavailable");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}

// Per-provider circuit breakers
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(providerId: string): CircuitBreaker {
  if (!circuitBreakers.has(providerId)) {
    circuitBreakers.set(providerId, new CircuitBreaker());
  }
  return circuitBreakers.get(providerId)!;
}

export async function callProviderWithSafety<T>(
  providerId: string,
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    retries?: number;
    backoffMs?: number;
  } = {}
): Promise<T> {
  const breaker = getCircuitBreaker(providerId);
  const timeout = options.timeout || 30000;
  const retries = options.retries || 3;
  const backoffMs = options.backoffMs || 1000;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await breaker.call(async () => {
        return Promise.race([
          fn(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("Provider call timeout")), timeout)
          ),
        ]);
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry circuit breaker errors
      if (lastError.message.includes("Circuit breaker")) {
        throw lastError;
      }

      // Exponential backoff
      if (attempt < retries - 1) {
        const delayMs = backoffMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error("Provider call failed after retries");
}

export function getProviderHealth(providerId: string): {
  state: CircuitBreakerState;
  healthy: boolean;
} {
  const breaker = getCircuitBreaker(providerId);
  const state = breaker.getState();
  return {
    state,
    healthy: state !== CircuitBreakerState.OPEN,
  };
}

export function getAllProviderHealth(): Record<string, { state: CircuitBreakerState; healthy: boolean }> {
  const health: Record<string, { state: CircuitBreakerState; healthy: boolean }> = {};

  for (const [providerId, breaker] of circuitBreakers.entries()) {
    const state = breaker.getState();
    health[providerId] = {
      state,
      healthy: state !== CircuitBreakerState.OPEN,
    };
  }

  return health;
}
