import type { HttpContext } from "../../types/common.type";
import type { CorsOptions } from "../../types/plugins/cors.type";

export function cors(opts: CorsOptions) {
  const allowedOrigin = opts.origin ?? "*";
  const methods = opts.methods ?? "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS";
  const allowedHeaders =
    opts.allowedHeaders ?? "Content-Type,Authorization,Cookie,X-Requested-With,Accept";
  const credentials = opts.credentials === true;

  return async (ctx: HttpContext, next: () => Promise<void>) => {
    const requestOrigin = ctx.request.headers["origin"] as string;

    if (allowedOrigin === "*") {
      if (credentials && requestOrigin) {
        ctx.response.setHeader("Access-Control-Allow-Origin", requestOrigin);
      } else {
        ctx.response.setHeader("Access-Control-Allow-Origin", "*");
      }
    } else if (Array.isArray(allowedOrigin)) {
      if (requestOrigin && allowedOrigin.includes(requestOrigin)) {
        ctx.response.setHeader("Access-Control-Allow-Origin", requestOrigin);
      }
    } else if (allowedOrigin) {
      ctx.response.setHeader("Access-Control-Allow-Origin", allowedOrigin as string);
    }

    if (credentials) {
      ctx.response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    ctx.response.setHeader(
      "Access-Control-Allow-Methods",
      Array.isArray(methods) ? methods.join(",") : methods,
    );

    ctx.response.setHeader(
      "Access-Control-Allow-Headers",
      Array.isArray(allowedHeaders) ? allowedHeaders.join(",") : allowedHeaders,
    );

    ctx.response.setHeader("Vary", "Origin");

    if (ctx.request.method === "OPTIONS") {
      ctx.response.statusCode = 204;
      ctx.response.setHeader("Content-Length", "0");
      ctx.response.end();
      return;
    }

    return next();
  };
}
