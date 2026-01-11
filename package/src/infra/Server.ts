import http from "node:http";
import cluster from "node:cluster";
import os from "node:os";

import { ConfigModule } from "../shared/config/ConfigModule";
import type { RequestServer } from "../types/http/request.type";
import type { CookieOptions, ResponseServer } from "../types/http/response.type";
import { HttpError } from "./utils/HttpError";
import { logger } from "../utils/Logger";
import { parseQS } from "../utils/Parser";
import { serializeCookie } from "../utils/cookies/SerializeCookie";
import { parseCookiesHeader } from "../utils/cookies/ParserCookie";
import { adaptRequestHandler } from "./utils/RequestHandler";
import { Router } from "./Router";
import type { RequestHandler } from "../types/common.type";
import { getIP } from "./utils/GetIp";
import type { Handler } from "./utils/route/Node";
import { cors } from "../shared/plugins/CORSPlugin";
import { rateLimit } from "../shared/plugins/RateLimitPlugin";
import type { ProxyOptions } from "../types";
import { proxyPlugin } from "../shared/plugins";

export { createLoggingMiddleware } from "../middleware/LoggingMiddleware";
export { proxyPlugin, createProxyMiddleware } from "../shared/plugins/ProxyPlugin";

export class AzuraClient {
  private opts: ReturnType<ConfigModule["getAll"]>;

  private server?: http.Server;
  private port: number = 3000;
  private initPromise: Promise<void>;

  private router: Router;
  private middlewares: RequestHandler[] = [];
  private proxies: Array<{ path: string; handler: RequestHandler }> = [];

  constructor() {
    const config = new ConfigModule();
    try {
      config.initSync();
    } catch (error: any) {
      console.error("[Azura] ❌ Falha ao carregar configuração:");
      console.error("        ", error.message);
      process.exit(1);
    }
    this.opts = config.getAll();
    this.router = new Router(this.opts.debug);
    this.initPromise = this.init();
    this.setupDefaultRoutes();
  }

  /**
   * Configura rotas padrão para evitar erros 404 comuns
   */
  private setupDefaultRoutes() {
    this.router.add(
      "GET",
      "/favicon.ico",
      adaptRequestHandler((ctx: any) => {
        ctx.res.status(204).send();
      }) as any
    );
  }

  public getConfig() {
    return this.opts;
  }

  private async init() {
    this.port = this.opts.server?.port || 3000;

    if (this.opts.server?.cluster && cluster.isPrimary) {
      for (let i = 0; i < os.cpus().length; i++) cluster.fork();
      cluster.on("exit", () => cluster.fork());
      return;
    }

    if (this.opts.plugins?.cors?.enabled) {
      cors({
        origin: this.opts.plugins.cors.origins,
        methods: this.opts.plugins.cors.methods,
        allowedHeaders: this.opts.plugins.cors.allowedHeaders,
      });

      logger("info", "CORS plugin enabled");
    }

    if (this.opts.plugins?.rateLimit?.enabled) {
      rateLimit(this.opts.plugins.rateLimit.limit, this.opts.plugins.rateLimit.timeframe);

      logger("info", "Rate Limit plugin enabled");
    }

    this.server = http.createServer();
    this.server.on("request", this.handle.bind(this));
  }

  public use(mw: RequestHandler): void;
  public use(prefix: string, router: Router): void;
  public use(prefixOrMw: string | RequestHandler, router?: Router): void {
    if (typeof prefixOrMw === "function") {
      this.middlewares.push(prefixOrMw);
    } else if (typeof prefixOrMw === "string" && router instanceof Router) {
      const prefix = prefixOrMw.endsWith("/") ? prefixOrMw.slice(0, -1) : prefixOrMw;
      const routes = router.listRoutes();

      for (const route of routes) {
        const fullPath = prefix + (route.path === "/" ? "" : route.path);
        const { handlers } = router.find(route.method, route.path);
        this.router.add(route.method, fullPath, ...handlers);
      }
    }
  }

  private addRoute(method: string, path: string, ...handlers: RequestHandler[]) {
    const adapted = handlers.map(adaptRequestHandler);
    this.router.add(method, path, ...(adapted as unknown as Handler[]));
  }

  public get = (p: string, ...h: RequestHandler[]) => this.addRoute("GET", p, ...h);
  public post = (p: string, ...h: RequestHandler[]) => this.addRoute("POST", p, ...h);
  public put = (p: string, ...h: RequestHandler[]) => this.addRoute("PUT", p, ...h);
  public delete = (p: string, ...h: RequestHandler[]) => this.addRoute("DELETE", p, ...h);
  public patch = (p: string, ...h: RequestHandler[]) => this.addRoute("PATCH", p, ...h);

  /**
   * Configures a proxy for a specific route
   * @param path - Path of the route to be proxied
   * @param target - Destination server URL
   * @param options - Additional proxy options
   * * @example
   * ```typescript
   * // Simple proxy
   * app.proxy('/api', 'http://localhost:4000');
   * * // With advanced options
   * app.proxy('/api', 'http://localhost:4000', {
   * pathRewrite: { '^/api': '' },
   * headers: { 'X-Custom-Header': 'value' }
   * });
   * ```
   */
  public proxy(path: string, target: string, options: Partial<ProxyOptions> = {}) {
    const proxyMiddleware = proxyPlugin(target, options);

    // Adicionar à lista de proxies
    this.proxies.push({ path, handler: proxyMiddleware });
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
        logger("error", `❌ Port ${port} is already in use. Please choose a different port.`);
      } else {
        logger("error", "Server failed to start: " + (error?.message || String(error)));
      }
      process.exit(1);
    });

    const who = cluster.isPrimary ? "master" : "worker";
    this.server.listen(port, () => {
      logger("info", `[${who}] listening on http://localhost:${port}`);
      if (this.opts.server?.ipHost) getIP(port);

      const routes = this.getRoutes();
      if (routes.length > 0) {
        logger("info", `\n📋 Registered routes (${routes.length}):`);
        routes.forEach((r) => {
          logger("info", `   ${r.method.padEnd(7)} ${r.path}`);
        });
      }
    });

    return this.server;
  }

  /**
   * Fetch handler compatible with Web API (Bun, Deno, Cloudflare Workers, etc.)
   * @example
   * ```typescript
   * const app = new AzuraClient();
   * app.get('/', (req, res) => res.text('Hello World!'));
   *
   * // Use with Bun
   * Bun.serve({
   *   port: 3000,
   *   fetch: app.fetch.bind(app),
   * });
   *
   * // Use with Deno
   * Deno.serve({ port: 3000 }, app.fetch.bind(app));
   * ```
   */
  public async fetch(request: Request): Promise<Response> {
    await this.initPromise;

    const url = new URL(request.url);
    const urlPath = url.pathname;

    const safeQuery: Record<string, string> = {};
    if (url.search) {
      const rawQuery = parseQS(url.search.slice(1));
      for (const k in rawQuery) {
        const v = rawQuery[k];
        safeQuery[k] = Array.isArray(v) ? v[0] || "" : (v as string);
      }
    }

    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parseCookiesHeader(cookieHeader);

    let body: any = {};
    if (["POST", "PUT", "PATCH"].includes(request.method.toUpperCase())) {
      const contentType = request.headers.get("content-type") || "";
      try {
        if (contentType.includes("application/json")) {
          body = await request.json();
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          const text = await request.text();
          const parsed = parseQS(text || "");
          const b: Record<string, string> = {};
          for (const k in parsed) {
            const v = parsed[k];
            b[k] = Array.isArray(v) ? v[0] || "" : (v as string) || "";
          }
          body = b;
        } else {
          body = await request.text();
        }
      } catch {
        body = {};
      }
    }

    const protocol = url.protocol.slice(0, -1) as "http" | "https";

    const headersObj: Record<string, string | string[]> = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    const rawReq: Partial<RequestServer> = {
      method: request.method,
      url: url.pathname + url.search,
      originalUrl: url.pathname + url.search,
      path: urlPath || "/",
      protocol,
      secure: url.protocol === "https:",
      hostname: url.hostname,
      subdomains: url.hostname ? url.hostname.split(".").slice(0, -2) : [],
      query: safeQuery,
      cookies,
      params: {},
      body,
      headers: headersObj as any,
      get: (name: string) => request.headers.get(name.toLowerCase()) || undefined,
      header: (name: string) => request.headers.get(name.toLowerCase()) || undefined,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
      ips: request.headers.get("x-forwarded-for")?.split(/\s*,\s*/) || [],
    };

    let statusCode = 200;
    const responseHeaders = new Headers();
    let responseBody: any = null;

    const rawRes: Partial<ResponseServer> = {
      statusCode,
      status: (code: number) => {
        statusCode = code;
        return rawRes as ResponseServer;
      },
      set: (field: string, value: string | number | string[]) => {
        responseHeaders.set(field, String(value));
        return rawRes as ResponseServer;
      },
      header: (field: string, value: string | number | string[]) => {
        responseHeaders.set(field, String(value));
        return rawRes as ResponseServer;
      },
      get: (field: string) => responseHeaders.get(field) || undefined,
      type: (t: string) => {
        responseHeaders.set("Content-Type", t);
        return rawRes as ResponseServer;
      },
      contentType: (t: string) => {
        responseHeaders.set("Content-Type", t);
        return rawRes as ResponseServer;
      },
      location: (u: string) => {
        responseHeaders.set("Location", u);
        return rawRes as ResponseServer;
      },
      redirect: ((a: number | string, b?: string) => {
        if (typeof a === "number") {
          statusCode = a;
          responseHeaders.set("Location", b!);
        } else {
          statusCode = 302;
          responseHeaders.set("Location", a);
        }
        return rawRes as ResponseServer;
      }) as ResponseServer["redirect"],
      cookie: (name: string, val: string, opts: CookieOptions = {}) => {
        const s = serializeCookie(name, val, opts);
        const prev = responseHeaders.get("Set-Cookie");
        if (prev) {
          responseHeaders.append("Set-Cookie", s);
        } else {
          responseHeaders.set("Set-Cookie", s);
        }
        return rawRes as ResponseServer;
      },
      clearCookie: (name: string, opts: CookieOptions = {}) => {
        return rawRes.cookie!(name, "", { ...opts, expires: new Date(1), maxAge: 0 });
      },
      send: (b: any) => {
        if (b === undefined || b === null) {
          responseBody = "";
        } else if (typeof b === "object") {
          responseHeaders.set("Content-Type", "application/json");
          responseBody = JSON.stringify(b);
        } else {
          responseBody = String(b);
        }
        return rawRes as ResponseServer;
      },
      json: (b: any) => {
        responseHeaders.set("Content-Type", "application/json");
        responseBody = JSON.stringify(b);
        return rawRes as ResponseServer;
      },
    };

    const errorHandler = (err: any) => {
      statusCode = err instanceof HttpError ? err.status : 500;
      responseHeaders.set("Content-Type", "application/json");
      responseBody = JSON.stringify(
        err instanceof HttpError
          ? err.payload ?? { error: err.message || "Internal Server Error" }
          : { error: err?.message || "Internal Server Error" }
      );
    };

    try {
      const { handlers, params } = this.router.find(request.method, urlPath || "/");
      rawReq.params = params || {};

      const chain = [
        ...this.middlewares.map(adaptRequestHandler),
        ...handlers.map(adaptRequestHandler),
      ];

      let idx = 0;
      const next = async (err?: any) => {
        if (err) return errorHandler(err);
        if (idx >= chain.length) return;
        const fn = chain[idx++];
        try {
          await fn({
            request: rawReq as RequestServer,
            response: rawRes as ResponseServer,
            req: rawReq as RequestServer,
            res: rawRes as ResponseServer,
            next,
          });
        } catch (e) {
          return errorHandler(e);
        }
      };

      await next();
    } catch (err) {
      errorHandler(err);
    }

    return new Response(responseBody, {
      status: statusCode,
      headers: responseHeaders,
    });
  }

  private async handle(rawReq: RequestServer, rawRes: ResponseServer) {
    rawReq.originalUrl = rawReq.url || "";
    rawReq.protocol = this.opts.server?.https ? "https" : "http";
    rawReq.secure = rawReq.protocol === "https";
    rawReq.hostname = String(rawReq.headers["host"] || "").split(":")[0] || "";
    rawReq.subdomains = rawReq.hostname ? rawReq.hostname.split(".").slice(0, -2) : [];
    const ipsRaw = rawReq.headers["x-forwarded-for"];
    rawReq.ips = typeof ipsRaw === "string" ? ipsRaw.split(/\s*,\s*/) : [];
    rawReq.get = rawReq.header = (name: string) => {
      const v = rawReq.headers[name.toLowerCase()];
      if (Array.isArray(v)) return v[0];
      return typeof v === "string" ? v : undefined;
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
      if (typeof b === "object") {
        rawRes.setHeader("Content-Type", "application/json");
        rawRes.end(JSON.stringify(b));
      } else {
        rawRes.end(String(b));
      }
      return rawRes;
    };

    rawRes.json = (b: any) => {
      rawRes.setHeader("Content-Type", "application/json");
      rawRes.end(JSON.stringify(b));
      return rawRes;
    };

    const [urlPath, qs] = (rawReq.url || "").split("?");
    rawReq.path = urlPath || "/";
    const rawQuery = parseQS(qs || "");
    const safeQuery: Record<string, string> = {};
    for (const k in rawQuery) {
      const v = rawQuery[k];
      safeQuery[k] = Array.isArray(v) ? v[0] || "" : (v as string) || "";
    }
    rawReq.query = safeQuery;

    rawReq.cookies = parseCookiesHeader((rawReq.headers["cookie"] as string) || "");
    rawReq.params = {};

    const ipRaw = rawReq.headers["x-forwarded-for"] || rawReq.socket.remoteAddress || "";
    const ipStr = Array.isArray(ipRaw) ? ipRaw[0] : ipRaw;
    rawReq.ip = String(ipStr).split(",")[0]?.trim() || "";

    rawReq.body = {};
    if (["POST", "PUT", "PATCH"].includes((rawReq.method || "").toUpperCase())) {
      await new Promise<void>((resolve) => {
        let buf = "";
        rawReq.on("data", (chunk: Buffer | string) => {
          buf += chunk;
        });
        rawReq.on("end", () => {
          try {
            const ct = String(rawReq.headers["content-type"] || "");
            if (ct.includes("application/json")) {
              rawReq.body = JSON.parse(buf || "{}");
            } else {
              const parsed = parseQS(buf || "");
              const b: Record<string, string> = {};
              for (const k in parsed) {
                const v = parsed[k];
                b[k] = Array.isArray(v) ? v[0] || "" : (v as string) || "";
              }
              rawReq.body = b;
            }
          } catch {
            rawReq.body = {};
          }
          resolve();
        });
        rawReq.on("error", (err: Error) => {
          logger("error", "Body parse error: " + err.message);
          resolve();
        });
      });
    }

    const errorHandler = (err: any) => {
      logger("error", err?.message || String(err));
      rawRes
        .status(err instanceof HttpError ? err.status : 500)
        .json(
          err instanceof HttpError
            ? err.payload ?? { error: err.message || "Internal Server Error" }
            : { error: err?.message || "Internal Server Error" }
        );
    };

    try {
      for (const proxy of this.proxies) {
        if (rawReq.path.startsWith(proxy.path)) {
          const chain = this.middlewares.map(adaptRequestHandler);
          let idx = 0;
          let middlewareError = false;

          const middlewareNext = async (err?: any) => {
            if (err) {
              middlewareError = true;
              return errorHandler(err);
            }
            if (idx >= chain.length) return;
            const fn = chain[idx++];
            try {
              await fn({
                request: rawReq,
                response: rawRes,
                req: rawReq,
                res: rawRes,
                next: middlewareNext,
              });
            } catch (e) {
              middlewareError = true;
              return errorHandler(e);
            }
          };

          await middlewareNext();

          if (!middlewareError) {
            await proxy.handler(rawReq, rawRes, middlewareNext);
          }
          return;
        }
      }

      const { handlers, params } = this.router.find(rawReq.method || "GET", rawReq.path);
      rawReq.params = params || {};
      const chain = [
        ...this.middlewares.map(adaptRequestHandler),
        ...handlers.map(adaptRequestHandler),
      ];
      let idx = 0;
      const next = async (err?: any) => {
        if (err) return errorHandler(err);
        if (idx >= chain.length) return;
        const fn = chain[idx++];
        try {
          await fn({
            request: rawReq,
            response: rawRes,
            req: rawReq,
            res: rawRes,
            next,
          });
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
