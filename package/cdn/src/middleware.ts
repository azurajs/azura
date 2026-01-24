import type { CacheEntry, CDNConfig } from "./types/common.js";
import { MemoryCache } from "./cache/memory.js";
import {
  generateETag,
  shouldReturn304,
  create304Headers,
  formatHttpDate,
} from "./http/conditional.js";
import { CompressionHandler } from "./http/compression.js";

export interface CacheMiddlewareOptions {
  ttl?: number;
  maxSize?: number;
  compression?: boolean;
  keyGenerator?: (req: any) => string;
  shouldCache?: (req: any, res: any) => boolean;
  tags?: (req: any) => string[];
}

export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const cache = new MemoryCache(options.maxSize || 100 * 1024 * 1024);
  const compression = options.compression ? new CompressionHandler() : null;
  const ttl = options.ttl || 300;

  const defaultKeyGenerator = (req: any) => {
    return `${req.method}:${req.url}`;
  };

  const defaultShouldCache = (req: any) => {
    return req.method === "GET" || req.method === "HEAD";
  };

  return async (req: any, res: any, next: () => void) => {
    const shouldCache = options.shouldCache || defaultShouldCache;

    if (!shouldCache(req, res)) {
      return next();
    }

    const keyGenerator = options.keyGenerator || defaultKeyGenerator;
    const cacheKey = keyGenerator(req);

    const cached = cache.get(cacheKey);
    if (cached) {
      if (shouldReturn304(req, cached)) {
        res.writeHead(304, create304Headers(cached));
        return res.end();
      }

      const headers: Record<string, string | string[]> = {
        ...cached.headers,
        "x-cache": "HIT",
      };

      if (cached.etag) {
        headers["etag"] = cached.etag;
      }
      if (cached.lastModified) {
        headers["last-modified"] = formatHttpDate(cached.lastModified);
      }

      const acceptEncoding = req.headers["accept-encoding"];
      if (compression && cached.compressed) {
        const encoding = compression.getBestEncoding(acceptEncoding);
        if (encoding === "br" && cached.compressed.brotli) {
          headers["content-encoding"] = "br";
          headers["vary"] = "Accept-Encoding";
          res.writeHead(200, headers as any);
          return res.end(cached.compressed.brotli);
        } else if (encoding === "gzip" && cached.compressed.gzip) {
          headers["content-encoding"] = "gzip";
          headers["vary"] = "Accept-Encoding";
          res.writeHead(200, headers as any);
          return res.end(cached.compressed.gzip);
        }
      }

      res.writeHead(200, headers as any);
      return res.end(cached.body);
    }

    const originalEnd = res.end.bind(res);
    const originalWrite = res.write.bind(res);
    const chunks: Buffer[] = [];

    res.write = (chunk: any) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return originalWrite(chunk);
    };

    res.end = async (chunk?: any) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const body = Buffer.concat(chunks);
      const statusCode = res.statusCode;

      if (statusCode >= 200 && statusCode < 300) {
        const now = Date.now();
        const entry: CacheEntry = {
          key: cacheKey,
          body,
          headers: res.getHeaders() as any,
          expiresAt: now + ttl * 1000,
          size: body.length,
          etag: generateETag(body),
          lastModified: now,
          createdAt: now,
          tags: options.tags ? options.tags(req) : undefined,
        };

        if (compression) {
          const contentType = res.getHeader("content-type") as string;
          if (compression.shouldCompress(contentType, body.length)) {
            entry.compressed = await compression.compressAll(body);
          }
        }

        cache.set(cacheKey, entry);
      }

      return originalEnd(chunk);
    };

    next();
  };
}

export default cacheMiddleware;
