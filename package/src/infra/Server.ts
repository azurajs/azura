import http from "node:http";
import cluster from "node:cluster";
import os from "node:os";

import { ConfigModule } from "../shared/config/ConfigModule";
import { getOpenPort } from "./utils/GetOpenPort";
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

export { createLoggingMiddleware } from "../middleware/LoggingMiddleware";

export class AzuraClient {
  private opts: ReturnType<ConfigModule["getAll"]>;

  private server?: http.Server;
  private port: number = 3000;
  private initPromise: Promise<void>;

  public router = new Router();
  private middlewares: RequestHandler[] = [];

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
    this.initPromise = this.init();
  }

  public getConfig() {
    return this.opts;
  }

  private async init() {
    this.port = await getOpenPort(this.opts.server?.port || 3000);

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

  public use(mw: RequestHandler) {
    this.middlewares.push(mw);
  }

  public addRoute(method: string, path: string, ...handlers: RequestHandler[]) {
    const adapted = handlers.map(adaptRequestHandler);
    this.router.add(method, path, ...(adapted as unknown as Handler[]));
  }

  public get = (p: string, ...h: RequestHandler[]) => this.addRoute("GET", p, ...h);
  public post = (p: string, ...h: RequestHandler[]) => this.addRoute("POST", p, ...h);
  public put = (p: string, ...h: RequestHandler[]) => this.addRoute("PUT", p, ...h);
  public delete = (p: string, ...h: RequestHandler[]) => this.addRoute("DELETE", p, ...h);
  public patch = (p: string, ...h: RequestHandler[]) => this.addRoute("PATCH", p, ...h);

  public async listen(port = this.port) {
    await this.initPromise;

    try {
      if (!this.server) {
        logger("error", "Server not initialized");
        return;
      }

      const who = cluster.isPrimary ? "master" : "worker";
      this.server.listen(port, () =>
        logger("info", `[${who}] listening on http://localhost:${port}`)
      );

      if (this.opts.server?.ipHost) getIP(port);
    } catch (error: Error | any) {
      logger("error", "Server failed to start: " + error?.message || String(error));
      process.exit(1);
    }
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
