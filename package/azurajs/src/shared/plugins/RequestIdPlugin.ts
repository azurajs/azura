import type { RequestHandler } from "../../types/common.type";

interface RequestIdOptions {
  header?: string;
  generator?: () => string;
}

export function requestId(options: RequestIdOptions = {}): RequestHandler {
  const header = options.header || "x-request-id";
  const generator = options.generator || (() => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  });

  return (req, res, next) => {
    let id = req.headers?.[header];

    if (!id) {
      id = generator();
    }

    (req as any).id = id;
    res.set(header, id as string);

    return next ? next() : Promise.resolve();
  };
}
