import http from "http";
import { URL } from "url";
import type { CacheEntry, CDNConfig, PurgeOptions, WarmOptions } from "./types/common.js";
import { MemoryCache } from "./cache/memory.js";
import { DiskCache } from "./cache/disk.js";
import { generateSignedUrl, verifySignedQuery } from "./http/signer.js";
import { streamFromOrigin } from "./http/origin.js";
import { parseCacheControl } from "./http/header.js";
import { collectStream } from "./utils/collector.js";
import { CompressionHandler } from "./http/compression.js";
import {
  generateETag,
  shouldReturn304,
  create304Headers,
  formatHttpDate,
} from "./http/conditional.js";
import { CDNEventEmitter } from "./events.js";
import { MetricsCollector } from "./metrics.js";

export function createServer(config: CDNConfig) {
  const memory = new MemoryCache(config.cache?.maxMemoryBytes);
  const disk =
    config.cache?.disk?.enabled && config.cache?.disk?.path
      ? new DiskCache(config.cache.disk.path, config.cache.disk.maxSizeBytes)
      : null;

  const compression = new CompressionHandler(config.compression);
  const events = new CDNEventEmitter();
  const metrics = new MetricsCollector();

  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  function getClientIp(req: http.IncomingMessage): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded)!.split(",")[0]!.trim();
    }
    return req.socket.remoteAddress || "unknown";
  }

  function checkRateLimit(req: http.IncomingMessage): boolean {
    if (!config.rateLimit?.enabled) return true;

    const key = config.rateLimit.keyGenerator
      ? config.rateLimit.keyGenerator(req)
      : getClientIp(req);

    const now = Date.now();
    const windowMs = config.rateLimit.windowMs || 60000;
    const max = config.rateLimit.max || 1000;

    let entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitMap.set(key, entry);
    }

    entry.count++;
    return entry.count <= max;
  }

  async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
    const startTime = Date.now();
    const url = req.url || "/";

    if (!checkRateLimit(req)) {
      res.writeHead(429, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Taxa de requisições excedida" }));
      return;
    }

    if (url.startsWith("/__")) {
      await handleInternalEndpoint(req, res, url);
      return;
    }

    const pathname = url.split("?")[0];
    const pathPrefix = config.signedUrls?.pathPrefix || "/private/";
    const isPrivate = pathname?.startsWith(pathPrefix);

    if (isPrivate && config.signedUrls) {
      const urlObj = new URL(req.url || "", "http://localhost");
      const expiresStr = urlObj.searchParams.get("expires") || undefined;
      const sig = urlObj.searchParams.get("sig") || undefined;

      if (!verifySignedQuery(pathname || "/", config.signedUrls.secret, expiresStr, sig)) {
        res.writeHead(403, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Proibido: Assinatura inválida ou expirada",
          }),
        );
        return;
      }
    }

    const cacheKey = url;

    let cached = memory.get(cacheKey);
    if (cached) {
      const latency = Date.now() - startTime;

      metrics.recordLatency(latency);
      metrics.recordHit("memory", cached.size);
      events.emit("hit", { key: cacheKey, source: "memory" });

      if (shouldReturn304(req, cached)) {
        res.writeHead(304, create304Headers(cached));
        res.end();
        return;
      }

      await serveFromCache(req, res, cached, "HIT-MEMORY");
      return;
    }

    if (disk) {
      cached = await disk.get(cacheKey);
      if (cached) {
        const latency = Date.now() - startTime;
        metrics.recordLatency(latency);
        metrics.recordHit("disk", cached.size);
        events.emit("hit", { key: cacheKey, source: "disk" });

        memory.set(cacheKey, cached);

        if (shouldReturn304(req, cached)) {
          res.writeHead(304, create304Headers(cached));
          res.end();
          return;
        }

        await serveFromCache(req, res, cached, "HIT-DISK");
        return;
      }
    }

    events.emit("miss", { key: cacheKey });

    streamFromOrigin(
      config.origin,
      url,
      req.headers,
      async (status, headers, stream) => {
        if (status >= 400) {
          metrics.recordError();
          res.writeHead(status, headers as any);
          stream.pipe(res);
          return;
        }

        const body = await collectStream(stream);
        const latency = Date.now() - startTime;
        metrics.recordLatency(latency);
        metrics.recordMiss(body.length);

        const cc = parseCacheControl(headers["cache-control"] as any);
        const ttl = cc.maxAge ?? config.cache?.ttl ?? 300;
        const expiresAt = Date.now() + ttl * 1000;
        const etag = generateETag(body);
        const now = Date.now();

        const entry: CacheEntry = {
          key: cacheKey,
          body,
          headers: headers as any,
          expiresAt,
          size: body.length,
          etag,
          lastModified: now,
          createdAt: now,
        };

        const contentType = headers["content-type"] as string;

        if (compression.shouldCompress(contentType, body.length)) {
          entry.compressed = await compression.compressAll(body);
          events.emit("compress", { key: cacheKey });
        }

        memory.set(cacheKey, entry);
        if (disk) await disk.set(cacheKey, entry);

        await serveFromCache(req, res, entry, "MISS");
      },
      (err) => {
        metrics.recordError();
        events.emit("error", { data: err });
        console.error("[CDN] Erro de origem:", err.message);

        if (config.cache?.staleIfError) {
          const stale = memory.get(cacheKey);
          if (stale) {
            serveFromCache(req, res, stale, "STALE");
            return;
          }
        }

        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Bad Gateway: Origem indisponível" }));
      },
    );
  }

  async function serveFromCache(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    entry: CacheEntry,
    cacheStatus: string,
  ): Promise<void> {
    const responseHeaders: Record<string, string | string[]> = {
      ...entry.headers,
      "x-cache": cacheStatus,
    };

    if (entry.etag) {
      responseHeaders["etag"] = entry.etag;
    }
    if (entry.lastModified) {
      responseHeaders["last-modified"] = formatHttpDate(entry.lastModified);
    }

    const acceptEncoding = req.headers["accept-encoding"] as string;
    const encoding = compression.getBestEncoding(acceptEncoding);

    let body = entry.body;

    if (encoding && entry.compressed) {
      if (encoding === "br" && entry.compressed.brotli) {
        body = entry.compressed.brotli;
        responseHeaders["content-encoding"] = "br";
        responseHeaders["vary"] = "Accept-Encoding";
      } else if (encoding === "gzip" && entry.compressed.gzip) {
        body = entry.compressed.gzip;
        responseHeaders["content-encoding"] = "gzip";
        responseHeaders["vary"] = "Accept-Encoding";
      }
    }

    responseHeaders["content-length"] = String(body.length);
    res.writeHead(200, responseHeaders as any);
    res.end(body);
  }

  async function handleInternalEndpoint(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    url: string,
  ): Promise<void> {
    if (req.method === "GET" && url === "/__stats") {
      const memStats = memory.getStats();
      const diskStats = disk ? await disk.getStats() : null;
      const cdnMetrics = metrics.getSummary();

      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ memory: memStats, disk: diskStats, metrics: cdnMetrics }, null, 2));
      return;
    }

    if (req.method === "GET" && url === "/__metrics") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(metrics.getSummary(), null, 2));
      return;
    }

    if (req.method === "GET" && url === "/__health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", uptime: process.uptime() }));
      return;
    }

    if (req.method === "POST" && url === "/__purge") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const json = JSON.parse(body);
          const path = json.path;
          const pattern = json.pattern || false;
          const tags = json.tags;

          let count = 0;

          if (tags && Array.isArray(tags)) {
            count = memory.deleteByTags(tags);
          } else if (typeof path === "string") {
            if (pattern) {
              count = memory.deleteByPattern(path);
              if (disk) count += await disk.deleteByPattern(path);
            } else {
              memory.delete(path);
              if (disk) await disk.delete(path);
              count = 1;
            }
          } else {
            res.writeHead(400, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "Caminho ou tags obrigatório" }));
            return;
          }

          events.emit("purge", { key: path, data: { count, pattern, tags } });
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: true, purged: count }));
        } catch (e) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "Requisição inválida" }));
        }
      });
      return;
    }

    if (req.method === "POST" && url === "/__clear") {
      memory.clear();
      if (disk) await disk.clear();
      events.emit("purge", { data: { all: true } });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, message: "Cache limpo" }));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint não encontrado" }));
  }

  const server = http.createServer(handle);

  return {
    listen(port = config.server?.port ?? 3001, host = config.server?.host ?? "0.0.0.0") {
      server.listen(port, host, () => {
        console.log(`🌐 CDN running at http://${host}:${port}`);
        console.log(`   └─ Origin: ${config.origin}`);
        console.log(
          `   └─ Memory cache: ${((config.cache?.maxMemoryBytes || 512 * 1024 * 1024) / 1024 / 1024).toFixed(0)}MB`,
        );
        if (disk) {
          console.log(`   └─ Disk cache: ${config.cache?.disk?.path}`);
        }
        if (config.compression?.enabled !== false) {
          console.log(
            `   └─ Compression: gzip${config.compression?.brotli !== false ? ", brotli" : ""}`,
          );
        }
        if (config.signedUrls) {
          console.log(
            `   └─ Signed URLs: enabled for ${config.signedUrls.pathPrefix || "/private/*"}`,
          );
        }
        if (config.rateLimit?.enabled) {
          console.log(`   └─ Rate limit: ${config.rateLimit.max}/${config.rateLimit.windowMs}ms`);
        }
      });
    },

    close(cb?: () => void) {
      server.close(cb);
    },

    on: events.on.bind(events),
    off: events.off.bind(events),

    purge(pathname: string, options?: PurgeOptions) {
      if (options?.tags) {
        return memory.deleteByTags(options.tags);
      }
      if (options?.pattern) {
        const count = memory.deleteByPattern(pathname);
        if (disk) disk.deleteByPattern(pathname);
        return count;
      }
      memory.delete(pathname);
      if (disk) disk.delete(pathname);
      events.emit("purge", { key: pathname });
      return 1;
    },

    purgeAll() {
      memory.clear();
      if (disk) disk.clear();
      events.emit("purge", { data: { all: true } });
    },

    purgeTags(tags: string[]) {
      return memory.deleteByTags(tags);
    },

    async warm(urls: string[], options?: WarmOptions): Promise<number> {
      const concurrency = options?.concurrency || 5;
      let warmed = 0;

      const warmUrl = async (url: string) => {
        return new Promise<void>((resolve) => {
          streamFromOrigin(
            config.origin,
            url,
            options?.headers || {},
            async (status, headers, stream) => {
              if (status < 400) {
                const body = await collectStream(stream);
                const entry: CacheEntry = {
                  key: url,
                  body,
                  headers: headers as any,
                  expiresAt: Date.now() + (config.cache?.ttl || 300) * 1000,
                  size: body.length,
                  etag: generateETag(body),
                  lastModified: Date.now(),
                  createdAt: Date.now(),
                };

                memory.set(url, entry);
                if (disk) await disk.set(url, entry);
                warmed++;
                events.emit("warm", { key: url });
              }
              resolve();
            },
            () => resolve(),
          );
        });
      };

      for (let i = 0; i < urls.length; i += concurrency) {
        const batch = urls.slice(i, i + concurrency);
        await Promise.all(batch.map(warmUrl));
      }

      return warmed;
    },

    generateSignedUrl(pathname: string, ttlSeconds?: number): string {
      if (!config.signedUrls) {
        throw new Error("URLs assinadas não configuradas");
      }

      const ttl = ttlSeconds ?? config.signedUrls.defaultTtl ?? 60;
      return generateSignedUrl(pathname, config.signedUrls.secret, ttl);
    },

    getMemoryStats() {
      return memory.getStats();
    },

    async getDiskStats() {
      return disk ? disk.getStats() : null;
    },

    getMetrics() {
      return metrics.getSummary();
    },

    resetMetrics() {
      metrics.reset();
    },

    async cleanup(): Promise<{ memory: number; disk: number }> {
      const memCleaned = memory.cleanup();
      const diskCleaned = disk ? await disk.cleanup() : 0;
      return { memory: memCleaned, disk: diskCleaned };
    },
  };
}
