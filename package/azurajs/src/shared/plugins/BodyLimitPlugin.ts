import type { RequestHandler } from "../../types/common.type";

interface BodyLimitOptions {
  limit?: number;
  type?: string | string[];
}

export function bodyLimit(options: BodyLimitOptions = {}): RequestHandler {
  const limit = options.limit || 1024 * 1024;
  const types = Array.isArray(options.type)
    ? options.type
    : options.type
      ? [options.type]
      : ["application/json", "application/x-www-form-urlencoded", "text/plain"];

  return (req, res, next) => {
    const contentType = req.headers?.["content-type"] || "";
    const contentLength = parseInt(req.headers?.["content-length"] || "0", 10);

    const shouldCheck = types.some((type) => contentType.includes(type));

    if (shouldCheck && contentLength > limit) {
      res.status(413).json({
        error: "Payload too large",
        limit,
        received: contentLength,
      });
      return;
    }

    return next ? next() : Promise.resolve();
  };
}
