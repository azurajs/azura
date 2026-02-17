import type { HttpContext } from "../../types/common.type";
import type { CorsOptions } from "../../types/plugins/cors.type";

function setHeader(res: any, key: string, value: string) {
  if (!res) return;
  if (typeof res.set === "function") return res.set(key, value);
  if (typeof res.setHeader === "function") return res.setHeader(key, value);
  if (typeof res.header === "function") return res.header(key, value);
  return;
}

function endResponse(res: any) {
  if (!res) return;
  if (typeof res.end === "function") {
    if (typeof res.statusCode === "number") res.statusCode = 204;
    setHeader(res, "Content-Length", "0");
    return res.end();
  }
  if (typeof res.send === "function") {
    if (typeof res.status === "function") res.status(204);
    setHeader(res, "Content-Length", "0");
    return res.send();
  }
  if (typeof res.status === "function") {
    res.status(204);
    setHeader(res, "Content-Length", "0");
  } else {
    if (typeof res.statusCode === "number") res.statusCode = 204;
    setHeader(res, "Content-Length", "0");
  }
  return;
}

export function cors(opts: CorsOptions) {
  const allowedOrigin = opts.origin ?? "*";
  const methods = opts.methods ?? "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS";
  const allowedHeaders =
    opts.allowedHeaders ?? "Content-Type,Authorization,Cookie,X-Requested-With,Accept";
  const credentials = opts.credentials === true;

  return async (ctx: HttpContext, next: () => Promise<void>) => {
    const reqHeaders = (ctx.request && (ctx.request.headers || {})) || {};
    const requestOrigin =
      typeof ctx.request.get === "function"
        ? ctx.request.get("origin")
        : reqHeaders["origin"] || reqHeaders["Origin"] || "";

    if (allowedOrigin === "*") {
      if (credentials && requestOrigin) {
        setHeader(
          ctx.response,
          "Access-Control-Allow-Origin",
          Array.isArray(requestOrigin) ? requestOrigin.join(",") : requestOrigin,
        );
      } else {
        setHeader(ctx.response, "Access-Control-Allow-Origin", "*");
      }
    } else if (Array.isArray(allowedOrigin)) {
      const originStr = Array.isArray(requestOrigin) ? requestOrigin[0] : requestOrigin;
      if (originStr && allowedOrigin.includes(originStr)) {
        setHeader(ctx.response, "Access-Control-Allow-Origin", originStr);
      }
    } else if (allowedOrigin) {
      setHeader(ctx.response, "Access-Control-Allow-Origin", allowedOrigin as string);
    }

    if (credentials) {
      setHeader(ctx.response, "Access-Control-Allow-Credentials", "true");
    }

    setHeader(
      ctx.response,
      "Access-Control-Allow-Methods",
      Array.isArray(methods) ? methods.join(",") : methods,
    );

    setHeader(
      ctx.response,
      "Access-Control-Allow-Headers",
      Array.isArray(allowedHeaders) ? allowedHeaders.join(",") : allowedHeaders,
    );

    setHeader(ctx.response, "Vary", "Origin");

    if ((ctx.request && ctx.request.method === "OPTIONS") || ctx.request.method === "OPTIONS") {
      return endResponse(ctx.response);
    }

    return next();
  };
}
