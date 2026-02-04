import type { RequestHandler } from "../../types/common.type";

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerOptions {
  threshold?: number;
  timeout?: number;
  resetTimeout?: number;
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
}

class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private nextAttempt = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is open");
      }
      this.setState("half-open");
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), this.options.timeout || 5000),
        ),
      ]);

      if (this.state === "half-open") {
        this.setState("closed");
      }

      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;

      if (this.failureCount >= (this.options.threshold || 5)) {
        this.setState("open");
        this.nextAttempt = Date.now() + (this.options.resetTimeout || 60000);
      }

      throw error;
    }
  }

  private setState(newState: CircuitState) {
    const oldState = this.state;
    this.state = newState;
    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState);
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

export function circuitBreaker(options: CircuitBreakerOptions = {}): RequestHandler {
  const breaker = new CircuitBreaker(options);

  return async (req, res, next) => {
    try {
      await breaker.execute(async () => {
        if (next) {
          await next();
        }
      });
    } catch (error: any) {
      if (error.message === "Circuit breaker is open") {
        res.status(503).json({ error: "Service unavailable" });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  };
}

export { CircuitBreaker };
