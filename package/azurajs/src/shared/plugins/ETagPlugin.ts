import { createHash } from "node:crypto";
import type { RequestHandler } from "../../types/common.type";

interface ETagOptions {
  weak?: boolean;
  algorithm?: "md5" | "sha1" | "sha256";
}

export function etag(options: ETagOptions = {}): RequestHandler {
  const weak = options.weak ?? true;
  const algorithm = options.algorithm || "md5";

  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    const generateETag = (body: any): string => {
      const content = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
      const hash = createHash(algorithm).update(content).digest("hex");
      return weak ? `W/"${hash}"` : `"${hash}"`;
    };

    const checkETag = (etag: string): boolean => {
      const ifNoneMatch = req.headers?.["if-none-match"];
      if (!ifNoneMatch) return false;

      const tags = ifNoneMatch.split(",").map((tag) => tag.trim());
      return tags.includes(etag) || tags.includes("*");
    };

    res.send = function (body: any) {
      if (body === undefined || body === null) {
        return originalSend.call(this, body);
      }

      // Não adicionar ETag se a resposta já foi finalizada
      if (res.writableEnded || res.headersSent) {
        return originalSend.call(this, body);
      }

      const etag = generateETag(body);
      res.set("ETag", etag);

      if (checkETag(etag)) {
        res.status(304);
        res.removeHeader("Content-Type");
        res.removeHeader("Content-Length");
        return originalSend.call(this, "");
      }

      return originalSend.call(this, body);
    };

    res.json = function (body: any) {
      // Não adicionar ETag se a resposta já foi finalizada
      if (res.writableEnded || res.headersSent) {
        return originalJson.call(this, body);
      }

      const jsonString = JSON.stringify(body);
      const etag = generateETag(jsonString);
      res.set("ETag", etag);

      if (checkETag(etag)) {
        res.status(304);
        res.removeHeader("Content-Type");
        res.removeHeader("Content-Length");
        return originalSend.call(this, "");
      }

      return originalJson.call(this, body);
    };

    return next ? next() : Promise.resolve();
  };
}
