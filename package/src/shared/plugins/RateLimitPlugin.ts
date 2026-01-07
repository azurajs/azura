import type { HttpContext } from "../../types/common.type";

interface Entry {
  count: number;
  ts: number;
}

const store = new Map<string, Entry>();

export function rateLimit(limit: number, ttl: number) {
  return async (ctx: HttpContext, next: () => Promise<void>) => {
    const ip = ctx.request.socket.remoteAddress;
    const now = Date.now();
    const entry = store.get(ip!) ?? { count: 0, ts: now };

    if (now - entry.ts > ttl) {
      entry.count = 1;
      entry.ts = now;
    } else {
      entry.count++;
    }

    store.set(ip!, entry);

    if (entry.count > limit) {
      ctx.response.status(429).send("Too many requests");
      return;
    }

    await next();
  };
}
