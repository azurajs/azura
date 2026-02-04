import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join, extname, resolve } from "node:path";
import { createHash } from "node:crypto";
import type { RequestHandler } from "../../types/common.type";

interface StaticOptions {
  maxAge?: number;
  immutable?: boolean;
  etag?: boolean;
  extensions?: string[];
  index?: string[];
  dotfiles?: "allow" | "deny" | "ignore";
}

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".zip": "application/zip",
  ".wasm": "application/wasm",
};

const cache = new Map<string, { etag: string; data: Buffer; mtime: number }>();

export function serveStatic(root: string, options: StaticOptions = {}): RequestHandler {
  const maxAge = options.maxAge ?? 0;
  const immutable = options.immutable ?? false;
  const useEtag = options.etag ?? true;
  const extensions = options.extensions ?? [".html"];
  const indexFiles = options.index ?? ["index.html"];
  const dotfiles = options.dotfiles ?? "ignore";

  const rootPath = resolve(root);

  return async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next ? next() : Promise.resolve();
    }

    let filePath = decodeURIComponent(req.path || "/");
    filePath = filePath.replace(/\\/g, "/").replace(/\.\.+/g, "");

    if (dotfiles === "deny" && /(^|\/)\.[^\/]+/.test(filePath)) {
      res.status(403).send("Forbidden");
      return;
    }

    if (dotfiles === "ignore" && /(^|\/)\.[^\/]+/.test(filePath)) {
      return next ? next() : Promise.resolve();
    }

    const fullPath = join(rootPath, filePath);

    if (!fullPath.startsWith(rootPath)) {
      res.status(403).send("Forbidden");
      return;
    }

    try {
      const stats = await stat(fullPath);

      let targetPath = fullPath;
      let targetStats = stats;

      if (stats.isDirectory()) {
        let found = false;
        for (const indexFile of indexFiles) {
          const indexPath = join(fullPath, indexFile);
          try {
            const indexStats = await stat(indexPath);
            if (indexStats.isFile()) {
              targetPath = indexPath;
              targetStats = indexStats;
              found = true;
              break;
            }
          } catch {}
        }
        if (!found) {
          return next ? next() : Promise.resolve();
        }
      } else if (!stats.isFile()) {
        return next ? next() : Promise.resolve();
      }

      const ext = extname(targetPath);
      const mimeType = mimeTypes[ext] || "application/octet-stream";

      res.set("Content-Type", mimeType);

      const cacheControl = [];
      if (maxAge > 0) {
        cacheControl.push(`max-age=${maxAge}`);
      }
      if (immutable) {
        cacheControl.push("immutable");
      }
      if (cacheControl.length > 0) {
        res.set("Cache-Control", cacheControl.join(", "));
      }

      const mtime = targetStats.mtimeMs;
      let etag: string | undefined;
      let fileData: Buffer | undefined;

      const cached = cache.get(targetPath);
      if (cached && cached.mtime === mtime) {
        etag = cached.etag;
        fileData = cached.data;
      } else {
        fileData = await readFile(targetPath);
        if (useEtag) {
          etag = `"${createHash("md5").update(fileData).digest("hex")}"`;
          cache.set(targetPath, { etag, data: fileData, mtime });
        }
      }

      if (useEtag && etag) {
        res.set("ETag", etag);
        const ifNoneMatch = req.headers?.["if-none-match"];
        if (ifNoneMatch === etag) {
          res.status(304).send("");
          return;
        }
      }

      const lastModified = new Date(targetStats.mtime).toUTCString();
      res.set("Last-Modified", lastModified);

      const ifModifiedSince = req.headers?.["if-modified-since"];
      if (ifModifiedSince && new Date(ifModifiedSince) >= targetStats.mtime) {
        res.status(304).send("");
        return;
      }

      if (req.method === "HEAD") {
        res.set("Content-Length", String(targetStats.size));
        res.send("");
        return;
      }

      res.send(fileData);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        return next ? next() : Promise.resolve();
      }
      res.status(500).send("Internal Server Error");
    }
  };
}
