import type { HttpContext } from "../../types/common.type";
import type { CorsOptions } from "../../types/plugins/cors.type";

export function cors(opts: CorsOptions) {
  const { origin, methods, allowedHeaders, credentials } = opts;

  return (ctx: HttpContext, next: () => Promise<void>) => {
    const requestOrigin = ctx.request.headers["origin"] as string;

    if (origin === "*") {
      ctx.response.setHeader("Access-Control-Allow-Origin", "*");
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        ctx.response.setHeader("Access-Control-Allow-Origin", requestOrigin);
      }
    } else if (origin) {
      ctx.response.setHeader("Access-Control-Allow-Origin", origin);
    }

    if (credentials) {
      ctx.response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    ctx.response.setHeader(
      "Access-Control-Allow-Methods",
      Array.isArray(methods) ? methods.join(",") : methods || "GET,HEAD,PUT,PATCH,POST,DELETE",
    );

    ctx.response.setHeader(
      "Access-Control-Allow-Headers",
      Array.isArray(allowedHeaders)
        ? allowedHeaders.join(",")
        : allowedHeaders || "Content-Type,Authorization",
    );

    if (ctx.request.method === "OPTIONS") {
      ctx.response.writeHead(204);
      return ctx.response.end();
    }

    return next();
  };
}
