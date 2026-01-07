import type { HttpContext } from "../../types/common.type";
import type { CorsOptions } from "../../types/plugins/cors.type";

export function cors(opts: CorsOptions) {
  const { origin, methods, allowedHeaders } = opts;

  return (ctx: HttpContext, next: () => Promise<void>) => {
    ctx.response.setHeader(
      "Access-Control-Allow-Origin",
      Array.isArray(origin) ? origin.join(",") : origin
    );
    ctx.response.setHeader(
      "Access-Control-Allow-Methods",
      Array.isArray(methods) ? methods.join(",") : methods
    );
    ctx.response.setHeader(
      "Access-Control-Allow-Headers",
      Array.isArray(allowedHeaders) ? allowedHeaders.join(",") : allowedHeaders
    );

    if (ctx.request.method === "OPTIONS") {
      ctx.response.writeHead(204);
      return ctx.response.end();
    }

    return next();
  };
}
