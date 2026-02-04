import type { RequestHandler } from "../../types/common.type";

interface TimeoutOptions {
  timeout?: number;
  message?: string;
  statusCode?: number;
}

export function timeout(options: TimeoutOptions = {}): RequestHandler {
  const timeoutMs = options.timeout || 30000;
  const message = options.message || "Request timeout";
  const statusCode = options.statusCode || 408;

  return (req, res, next) => {
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      if (!res.writableEnded && !res.headersSent) {
        res.status(statusCode).json({ error: message });
      }
    }, timeoutMs);

    const originalEnd = res.end;
    (res as any).end = function (...args: any[]) {
      clearTimeout(timer);
      if (!timedOut && !res.headersSent) {
        return originalEnd.call(this, args[0], args[1] as BufferEncoding, args[2] as (() => void) | undefined);
      }
    };

    return next ? next() : Promise.resolve();
  };
}
