import type { HttpContext } from "../../types/common.type";
import type { CorsOptions } from "../../types/plugins/cors.type";

function setHeader(res: any, key: string, value: string) {
  if (!res) return;
  if (typeof res.set === "function") return res.set(key, value);
  if (typeof res.setHeader === "function") return res.setHeader(key, value);
  if (typeof res.header === "function") return res.header(key, value);
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

  return async function middleware(a: any, b?: any, c?: any) {
    let request: any;
    let response: any;
    let next: any;

    if (a && a.request && typeof b === "function") {
      request = a.request;
      response = a.response;
      next = b;
    } else if (c && typeof c === "function") {
      request = a;
      response = b;
      next = c;
    } else {
      request = (a && (a.request || a.req)) || a;
      response = (a && (a.response || a.res)) || b;
      next = (a && a.next) || (() => Promise.resolve());
    }

    const reqHeaders = (request && (request.headers || {})) || {};
    const requestOrigin =
      typeof request?.get === "function"
        ? request.get("origin")
        : reqHeaders["origin"] || reqHeaders["Origin"] || "";

    if (allowedOrigin === "*") {
      if (credentials && requestOrigin) {
        setHeader(response, "Access-Control-Allow-Origin", requestOrigin);
      } else {
        setHeader(response, "Access-Control-Allow-Origin", "*");
      }
    } else if (Array.isArray(allowedOrigin)) {
      if (requestOrigin && allowedOrigin.includes(requestOrigin)) {
        setHeader(response, "Access-Control-Allow-Origin", requestOrigin);
      }
    } else if (allowedOrigin) {
      setHeader(response, "Access-Control-Allow-Origin", allowedOrigin as string);
    }

    if (credentials) {
      setHeader(response, "Access-Control-Allow-Credentials", "true");
    }

    setHeader(
      response,
      "Access-Control-Allow-Methods",
      Array.isArray(methods) ? methods.join(",") : methods,
    );

    setHeader(
      response,
      "Access-Control-Allow-Headers",
      Array.isArray(allowedHeaders) ? allowedHeaders.join(",") : allowedHeaders,
    );

    setHeader(response, "Vary", "Origin");

    const method = (request && (request.method || request?.req?.method)) || "";

    if (method === "OPTIONS") {
      return endResponse(response);
    }

    return next();
  };
}
