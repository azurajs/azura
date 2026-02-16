import http from "node:http";
import cluster, { worker } from "node:cluster";
import os from "node:os";

import { ConfigModule } from "../shared/config/ConfigModule";
import type { RequestServer } from "../types/http/request.type";
import type { CookieOptions, ResponseServer } from "../types/http/response.type";
import { HttpError } from "./utils/HttpError";
import { logger } from "../utils/Logger";
import { parseQS } from "../utils/Parser";
import { serializeCookie } from "../utils/cookies/SerializeCookie";
import { parseCookiesHeader } from "../utils/cookies/ParserCookie";
import { Router } from "./Router";
import type { InternalHandler, RequestHandler } from "../types/common.type";
import { getIP } from "./utils/GetIp";
import { resolveIp } from "./utils/IpResolver";
import { cors } from "../shared/plugins/CORSPlugin";
import { rateLimit } from "../shared/plugins/RateLimitPlugin";
import type { ProxyOptions } from "../types";
import { proxyPlugin } from "../shared/plugins";
import { composeHandlers } from "./utils/Compose";

export { createLoggingMiddleware } from "../middleware/LoggingMiddleware";
export { proxyPlugin, createProxyMiddleware } from "../shared/plugins/ProxyPlugin";

function adaptRequestHandler(handler: RequestHandler): InternalHandler {
  return async (ctx) => {
    if (typeof handler !== "function") return;
    if (handler.length > 1) {
      return (handler as any)(ctx.req, ctx.res, ctx.next);
    } else {
      return (handler as any)(ctx);
    }
  };
}

export class AzuraClient {
  private opts: ReturnType<ConfigModule["getAll"]>;
  private server?: http.Server;
  private port: number = 3000;
  private initPromise: Promise<void>;
  private router: Router;
  private middlewares: RequestHandler[] = [];
  private proxies: Array<{ path: string; handler: RequestHandler }> = [];
  private isShuttingDown: boolean = false;

  constructor() {
    const config = new ConfigModule();
    try {
      config.initSync();
    } catch (error: any) {
      console.error("[Azura] ❌ Falha ao carregar configuração:", error.message);
      process.exit(1);
    }
    this.opts = config.getAll();
    this.router = new Router(this.opts.debug);
    this.initPromise = this.init();
    this.setupDefaultRoutes();
  }

  private setupDefaultRoutes() {
    this.router.add(
      "GET",
      "/favicon.ico",
      adaptRequestHandler((ctx: any) => {
        ctx.res.status(204).send();
      }) as any,
    );
  }

  public getConfig() {
    return this.opts;
  }

  private async init() {
    this.port = this.opts.server?.port || 3000;

    if (this.opts.server?.cluster && cluster.isPrimary) {
      const cpuCount = os.cpus().length;
      const desired = this.opts.server.clusterInstances ?? 2;

      const workers = desired > cpuCount ? 2 : Math.max(1, desired);

      for (let i = 0; i < workers; i++) cluster.fork();
      cluster.on("exit", () => cluster.fork());
      return;
    }

    if (this.opts.plugins?.cors?.enabled) {
      cors({
        origin: this.opts.plugins.cors.origins,
        methods: this.opts.plugins.cors.methods,
        allowedHeaders: this.opts.plugins.cors.allowedHeaders,
        credentials: this.opts.plugins.cors.credentials,
      });
      logger("info", "CORS plugin enabled");
    }

    if (this.opts.plugins?.rateLimit?.enabled) {
      rateLimit(this.opts.plugins.rateLimit.limit, this.opts.plugins.rateLimit.timeframe);
      logger("info", "Rate Limit plugin enabled");
    }

    // Create server WITHOUT handler to allow upgrade events to work properly
    this.server = http.createServer();

    // Add request handler manually
    this.server.on("request", (req, res) => {
      this.handle(req as any, res as any);
    });
  }

  public use(prefix: string, mw: RequestHandler): void;
  public use(mw: RequestHandler): void;
  public use(prefix: string, router: Router): void;
  public use(prefixOrMw: string | RequestHandler, routerOrMw?: Router | RequestHandler): void {
    if (typeof prefixOrMw === "function") {
      this.middlewares.push(prefixOrMw);
    } else if (typeof prefixOrMw === "string" && routerOrMw instanceof Router) {
      const prefix = prefixOrMw.endsWith("/") ? prefixOrMw.slice(0, -1) : prefixOrMw;
      const routes = routerOrMw.listRoutes();
      for (const r of routes) {
        const found = routerOrMw.find(r.method, r.path);
        if (!found) continue;
        const fullPath = prefix + (r.path === "/" ? "" : r.path);

        this.router.add(r.method, fullPath, found.handler);
      }
    } else if (typeof prefixOrMw === "string" && typeof routerOrMw === "function") {
      const prefix = prefixOrMw;
      const mw = routerOrMw as RequestHandler;

      const wrapper: RequestHandler = (req, res, next) => {
        if (req.path && req.path.startsWith(prefix)) {
          if (mw.length > 1) {
            return (mw as any)(req, res, next);
          } else {
            return (mw as any)({ req, res, next, request: req, response: res });
          }
        }
        return next ? next() : Promise.resolve();
      };
      this.middlewares.push(wrapper);
    }
  }

  public addRoute(method: string, path: string, ...handlers: RequestHandler[]): void {
    const adapted: InternalHandler[] = handlers.map((h) => adaptRequestHandler(h));
    const composed = composeHandlers(adapted);
    this.router.add(method, path, composed);
  }

  public get = (p: string, ...h: RequestHandler[]) => this.addRoute("GET", p, ...h);
  public post = (p: string, ...h: RequestHandler[]) => this.addRoute("POST", p, ...h);
  public put = (p: string, ...h: RequestHandler[]) => this.addRoute("PUT", p, ...h);
  public delete = (p: string, ...h: RequestHandler[]) => this.addRoute("DELETE", p, ...h);
  public patch = (p: string, ...h: RequestHandler[]) => this.addRoute("PATCH", p, ...h);
  public all = (p: string, ...h: RequestHandler[]) => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
    for (const method of methods) {
      this.addRoute(method, p, ...h);
    }
  };

  public proxy(path: string, target: string, options: Partial<ProxyOptions> = {}) {
    this.proxies.push({ path, handler: proxyPlugin(target, options) as RequestHandler });
  }

  public getRoutes() {
    return this.router.listRoutes();
  }

  public async listen(port = this.port) {
    await this.initPromise;

    if (!this.server) {
      logger("error", "Server not initialized");
      return;
    }

    this.server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger("error", `❌ Port ${port} is already in use.`);
      } else {
        logger("error", "Server failed to start: " + (error?.message || String(error)));
      }
      process.exit(1);
    });

    const who = cluster.isPrimary ? "master" : "worker";
    this.server.listen(port, () => {
      logger("info", `[${who}] listening on http://localhost:${port}`);
      if (this.opts.server?.ipHost) getIP(port);

      if (this.opts.logging?.enabled) {
        const routes = this.getRoutes();
        if (routes.length > 0) {
          logger("info", `\n📋 Registered routes (${routes.length}):`);
          routes.forEach((r) => {
            logger("info", `   ${r.method.padEnd(7)} ${r.path}`);
          });
        }
      }
    });

    return this.server;
  }

  public async shutdown(timeout: number = 10000): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger("info", "Starting graceful shutdown...");

    return new Promise((resolve) => {
      const forceShutdown = setTimeout(() => {
        logger("warn", "Forcing shutdown after timeout");
        process.exit(1);
      }, timeout);

      if (this.server) {
        this.server.close(() => {
          clearTimeout(forceShutdown);
          logger("info", "Server closed successfully");
          resolve();
        });
      } else {
        clearTimeout(forceShutdown);
        resolve();
      }
    });
  }

  public async fetch(request: Request): Promise<Response> {
    await this.initPromise;
    const url = new URL(request.url);
    const qs = url.search.slice(1);

    const rawReq: any = {
      method: request.method,
      url: url.pathname + url.search,
      originalUrl: url.pathname + url.search,
      path: url.pathname || "/",
      protocol: url.protocol.slice(0, -1),
      secure: url.protocol === "https:",
      headers: {},
      params: {},
    };

    request.headers.forEach((v, k) => (rawReq.headers[k] = v));

    let _query: any;
    Object.defineProperty(rawReq, "query", {
      get: () => (_query ? _query : (_query = parseQS(qs))),
    });

    let _cookies: any;
    Object.defineProperty(rawReq, "cookies", {
      get: () =>
        _cookies ? _cookies : (_cookies = parseCookiesHeader(request.headers.get("cookie") || "")),
    });

    const trust = this.opts.server;
    let _ip: any;
    Object.defineProperty(rawReq, "ip", {
      get: () => {
        if (_ip) return _ip;
        const res = resolveIp(rawReq, { trustProxy: trust?.trustProxy, ipHeader: trust?.ipHeader });
        rawReq.ips = res.ips;
        return (_ip = res.ip);
      },
    });

    if (["POST", "PUT", "PATCH"].includes(request.method.toUpperCase())) {
      try {
        const ct = request.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          rawReq.body = await request.json();
        } else if (ct.includes("application/x-www-form-urlencoded")) {
          const t = await request.text();
          const p = parseQS(t);
          const b: any = {};
          for (const k in p) {
            const v = p[k];
            b[k] = Array.isArray(v) ? v[0] || "" : (v as string) || "";
          }
          rawReq.body = b;
        } else {
          rawReq.body = await request.text();
        }
      } catch {
        rawReq.body = {};
      }
    } else {
      rawReq.body = {};
    }

    let statusCode = 200;
    const headers = new Headers();
    let body: any = null;

    const rawRes: any = {
      statusCode,
      status: (c: number) => {
        statusCode = c;
        return rawRes;
      },
      set: (k: string, v: string) => {
        headers.set(k, v);
        return rawRes;
      },
      header: (k: string, v: string) => {
        headers.set(k, v);
        return rawRes;
      },
      get: (k: string) => headers.get(k),
      type: (v: string) => {
        headers.set("Content-Type", v);
        return rawRes;
      },
      contentType: (v: string) => {
        headers.set("Content-Type", v);
        return rawRes;
      },
      send: (b: any) => {
        if (typeof b === "object") {
          headers.set("Content-Type", "application/json");
          body = JSON.stringify(b);
        } else {
          body = String(b || "");
        }
        return rawRes;
      },
      json: (b: any) => {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify(b);
        return rawRes;
      },
    };

    try {
      const match = this.router.find(rawReq.method, rawReq.path);
      if (!match) return new Response("Not Found", { status: 404 });

      rawReq.params = match.params || {};

      const chain = [...this.middlewares.map(adaptRequestHandler), match.handler];

      let idx = 0;
      const next = async (err?: any) => {
        if (err) throw err;
        if (idx >= chain.length) return;
        const fn = chain[idx++];
        if (!fn) return;
        await fn({ req: rawReq, res: rawRes, next });
      };

      await next();
    } catch (err: any) {
      statusCode = err instanceof HttpError ? err.status : 500;
      headers.set("Content-Type", "application/json");
      body = JSON.stringify({ error: err.message || "Internal Server Error" });
    }

    return new Response(body, { status: statusCode, headers });
  }

  private async handle(rawReq: RequestServer, rawRes: ResponseServer) {
    const urlStr = rawReq.url || "/";
    const qIndex = urlStr.indexOf("?");
    const path = qIndex === -1 ? urlStr : urlStr.substring(0, qIndex);

    rawReq.path = path;
    rawReq.originalUrl = urlStr;
    rawReq.protocol = this.opts.server?.https ? "https" : "http";
    rawReq.secure = rawReq.protocol === "https";

    let _query: any = null;
    Object.defineProperty(rawReq, "query", {
      configurable: true,
      enumerable: true,
      get: () => {
        if (_query !== null) return _query;
        if (qIndex === -1) return (_query = {});
        return (_query = parseQS(urlStr.substring(qIndex + 1)));
      },
    });

    let _cookies: any = null;
    Object.defineProperty(rawReq, "cookies", {
      configurable: true,
      enumerable: true,
      get: () => {
        if (_cookies !== null) return _cookies;
        return (_cookies = parseCookiesHeader((rawReq.headers["cookie"] as string) || ""));
      },
    });

    let _ip: string | undefined;
    const trustProxy = this.opts.server?.trustProxy;
    const ipHeader = this.opts.server?.ipHeader;
    Object.defineProperty(rawReq, "ip", {
      configurable: true,
      enumerable: true,
      get: () => {
        if (_ip !== undefined) return _ip;
        const res = resolveIp(rawReq, { trustProxy, ipHeader });
        rawReq.ips = res.ips;
        return (_ip = res.ip);
      },
    });

    rawReq.get = rawReq.header = (name: string) => {
      const v = rawReq.headers[name.toLowerCase()];
      if (Array.isArray(v)) return v[0];
      return v;
    };

    rawRes.status = (code: number) => {
      rawRes.statusCode = code;
      return rawRes;
    };

    rawRes.set = rawRes.header = (field: string, value: string | number | string[]) => {
      rawRes.setHeader(field, value);
      return rawRes;
    };

    rawRes.get = (field: string) => {
      const v = rawRes.getHeader(field);
      if (Array.isArray(v)) return v[0];
      return typeof v === "number" ? String(v) : (v as string | undefined);
    };

    rawRes.type = rawRes.contentType = (t: string) => {
      rawRes.setHeader("Content-Type", t);
      return rawRes;
    };

    rawRes.location = (u: string) => {
      rawRes.setHeader("Location", u);
      return rawRes;
    };

    rawRes.redirect = ((a: number | string, b?: string) => {
      if (typeof a === "number") {
        rawRes.statusCode = a;
        rawRes.setHeader("Location", b!);
      } else {
        rawRes.statusCode = 302;
        rawRes.setHeader("Location", a);
      }
      rawRes.end();
      return rawRes;
    }) as ResponseServer["redirect"];

    rawRes.cookie = (name: string, val: string, opts: CookieOptions = {}) => {
      const s = serializeCookie(name, val, opts);
      const prev = rawRes.getHeader("Set-Cookie");
      if (prev) {
        const list = Array.isArray(prev) ? prev.concat(s) : [String(prev), s];
        rawRes.setHeader("Set-Cookie", list);
      } else {
        rawRes.setHeader("Set-Cookie", s);
      }
      return rawRes;
    };

    rawRes.clearCookie = (name: string, opts: CookieOptions = {}) => {
      return rawRes.cookie(name, "", { ...opts, expires: new Date(1), maxAge: 0 });
    };

    rawRes.send = (b: any) => {
      if (b === undefined || b === null) {
        rawRes.end();
        return rawRes;
      }
      if (typeof b === "object" && !Buffer.isBuffer(b)) {
        rawRes.setHeader("Content-Type", "application/json");
        rawRes.end(JSON.stringify(b));
      } else {
        rawRes.end(b);
      }
      return rawRes;
    };

    rawRes.json = (b: any) => {
      rawRes.setHeader("Content-Type", "application/json");
      rawRes.end(JSON.stringify(b));
      return rawRes;
    };

    rawReq.body = {};
    const method = rawReq.method || "GET";

    if (method === "POST" || method === "PUT" || method === "PATCH") {
      const chunks: Buffer[] = [];
      try {
        await new Promise<void>((resolve, reject) => {
          rawReq.on("data", (chunk) => chunks.push(chunk));
          rawReq.on("end", () => {
            if (chunks.length === 0) return resolve();
            const buffer = Buffer.concat(chunks);
            const ct = rawReq.headers["content-type"] || "";
            try {
              if (ct.includes("application/json")) {
                rawReq.body = JSON.parse(buffer.toString());
              } else if (ct.includes("application/x-www-form-urlencoded")) {
                const parsed = parseQS(buffer.toString());
                const b: Record<string, string> = {};
                for (const k in parsed) {
                  const v = parsed[k];
                  b[k] = Array.isArray(v) ? v[0] || "" : (v as string) || "";
                }
                rawReq.body = b;
              } else {
                rawReq.body = buffer.toString();
              }
            } catch {
              rawReq.body = {};
            }
            resolve();
          });
          rawReq.on("error", (err) => {
            reject(err);
          });
        });
      } catch (err: any) {
        logger("error", "Body parse error: " + err.message);
      }
    }

    const errorHandler = (err: any) => {
      if (!rawRes.writableEnded) {
        logger("error", err?.message || String(err));
        rawRes
          .status(err instanceof HttpError ? err.status : 500)
          .json(
            err instanceof HttpError
              ? (err.payload ?? { error: err.message || "Internal Server Error" })
              : { error: err?.message || "Internal Server Error" },
          );
      }
    };

    try {
      const proxies = this.proxies;
      const pLen = proxies.length;
      if (pLen > 0) {
        for (let i = 0; i < pLen; i++) {
          const proxy = proxies[i];
          if (proxy && path.startsWith(proxy.path)) {
            const chain = this.middlewares.map(adaptRequestHandler);
            let idx = 0;
            const middlewareNext = async (err?: any) => {
              if (err) return errorHandler(err);
              if (idx >= chain.length) return;
              const fn = chain[idx++];
              if (!fn) return;
              try {
                await fn({ req: rawReq, res: rawRes, next: middlewareNext });
              } catch (e) {
                return errorHandler(e);
              }
            };
            await middlewareNext();

            if (!rawRes.writableEnded) {
              const handler = adaptRequestHandler(proxy.handler);
              await handler({ req: rawReq, res: rawRes, next: middlewareNext });
            }
            return;
          }
        }
      }

      const match = this.router.find(method, path);
      if (!match) {
        throw new HttpError(404, "Not Found");
      }

      rawReq.params = match.params || {};

      const chain = [...this.middlewares.map(adaptRequestHandler), match.handler];

      let idx = 0;
      const next = async (err?: any) => {
        if (err) return errorHandler(err);
        if (idx >= chain.length) return;
        const fn = chain[idx++];
        if (!fn) return;
        try {
          await fn({ req: rawReq, res: rawRes, next });
        } catch (e) {
          return errorHandler(e);
        }
      };
      await next();
    } catch (err) {
      errorHandler(err);
    }
  }
}
