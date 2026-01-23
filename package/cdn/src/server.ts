import http from "http";
import { collectStream } from "./utils/collector";
import { URL } from "url";
import type { CacheEntry, CDNConfig } from "./types/common";
import { MemoryCache } from "./cache/memory";
import { DiskCache } from "./cache/disk";
import { generateSignedUrl, verifySignedQuery } from "./http/signer";
import { streamFromOrigin } from "./http/origin";
import { parseCacheControl } from "./http/header";

export function createServer(config: CDNConfig) {
  const memory = new MemoryCache(config.cache?.maxMemoryBytes);
  const disk =
    config.cache?.disk?.enabled && config.cache?.disk?.path
      ? new DiskCache(config.cache.disk.path)
      : null;

  async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
    const url = req.url || "/";
    if (req.method === "POST" && url === "/__purge") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const j = JSON.parse(body);
          const key = j.path;
          if (typeof key === "string") {
            memory.delete(key);
            if (disk) disk.delete(key);

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
            return;
          }
        } catch (e) {}
        res.writeHead(400);
        res.end("bad request");
      });
      return;
    }

    const pathname = url.split("?")[0];
    const isPrivate = pathname?.startsWith("/private/");
    if (
      isPrivate &&
      config.signedUrls &&
      !verifySignedQuery(
        pathname || "/",
        config.signedUrls.secret,
        new URL(req.url || "", "http://localhost").searchParams.get("expires") || undefined,
        new URL(req.url || "", "http://localhost").searchParams.get("sig") || undefined,
      )
    ) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }

    const cacheKey = url;
    const cached = memory.get(cacheKey);
    if (cached) {
      res.writeHead(200, cached.headers as any);
      res.end(cached.body);
      return;
    }

    if (disk) {
      const d = await disk.get(cacheKey);
      if (d) {
        res.writeHead(200, { "x-cache": "HIT-DISK" });
        res.end(d);
        return;
      }
    }

    streamFromOrigin(
      config.origin,
      url,
      req.headers,
      async (status, headers, stream) => {
        if (status >= 400) {
          res.writeHead(status, headers as any);
          stream.pipe(res);
          return;
        }

        const body = await collectStream(stream);
        const cc = parseCacheControl(headers["cache-control"] as any);
        const ttl = cc.maxAge ?? config.cache?.ttl ?? 300;
        const expiresAt = Date.now() + ttl * 1000;
        const entry: CacheEntry = {
          key: cacheKey,
          body,
          headers: headers as any,
          expiresAt,
          size: body.length,
        };

        memory.set(cacheKey, entry);
        if (disk) await disk.set(cacheKey, body);

        res.writeHead(status, { ...headers, "x-cache": "MISS" } as any);
        res.end(body);
      },
      (err) => {
        res.writeHead(500);
        res.end("origin error");
      },
    );
  }

  const server = http.createServer(handle);

  return {
    listen(port = config.server?.port ?? 3000, host = config.server?.host ?? "0.0.0.0") {
      server.listen(port, host);
    },

    close(cb?: () => void) {
      server.close(cb);
    },

    purge(pathname: string) {
      memory.delete(pathname);
      if (disk) disk.delete(pathname);
    },

    generateSignedUrl(pathname: string, ttlSeconds = 60) {
      if (!config.signedUrls) throw new Error("signedUrls not configured");
      return generateSignedUrl(pathname, config.signedUrls.secret, ttlSeconds);
    },
  };
}
