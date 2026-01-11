import http from "node:http";
import https from "node:https";
import type { RequestServer } from "../../types/http/request.type";
import type { ResponseServer } from "../../types/http/response.type";
import { logger } from "../../utils/Logger";
import type { ProxyOptions } from "../../types/plugins/proxy.type";

export function createProxyMiddleware(options: ProxyOptions) {
  const {
    target,
    pathRewrite = {},
    headers = {},
    timeout = 30000,
    followRedirects = false,
    preserveHost = false,
    logLevel = "info",
    onProxyReq,
    onProxyRes,
    onError,
  } = options;

  return async (req: RequestServer, res: ResponseServer, next?: Function) => {
    try {
      // Parse target URL
      const targetUrl = new URL(target);
      const isHttps = targetUrl.protocol === "https:";
      const client = isHttps ? https : http;

      // Construir o path
      let path = req.path || "/";

      // Aplicar path rewrites
      for (const [pattern, replacement] of Object.entries(pathRewrite)) {
        const regex = new RegExp(pattern);
        path = path.replace(regex, replacement);
      }

      // Adicionar query string
      if (req.url && req.url.includes("?")) {
        const queryString = req.url.split("?")[1];
        path += `?${queryString}`;
      }

      if (logLevel !== "none") {
        logger(
          logLevel === "debug" ? "info" : "info",
          `[Proxy] ${req.method} ${req.url} → ${target}${path}`
        );
      }

      // Configurar headers
      const proxyHeaders: http.OutgoingHttpHeaders = {
        ...req.headers,
        ...headers,
      };

      // Remover headers problemáticos
      delete proxyHeaders["host"];
      delete proxyHeaders["connection"];
      delete proxyHeaders["transfer-encoding"];

      if (preserveHost && req.headers.host) {
        proxyHeaders["host"] = req.headers.host;
      } else {
        proxyHeaders["host"] = targetUrl.host;
      }

      // Adicionar headers de forwarding
      if (req.ip) {
        proxyHeaders["x-forwarded-for"] = req.ip;
      }
      proxyHeaders["x-forwarded-proto"] = req.protocol || "http";
      proxyHeaders["x-forwarded-host"] = req.headers.host || "";

      // Criar requisição proxy
      const proxyReqOptions: http.RequestOptions = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (isHttps ? 443 : 80),
        path,
        method: req.method,
        headers: proxyHeaders,
        timeout,
      };

      const proxyReq = client.request(proxyReqOptions, (proxyRes) => {
        // Callback customizado
        if (onProxyRes) {
          onProxyRes(proxyRes, req, res);
        }

        // Copiar status code
        res.statusCode = proxyRes.statusCode || 200;

        // Copiar headers (exceto alguns problemáticos)
        if (proxyRes.headers) {
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            if (key.toLowerCase() !== "transfer-encoding" && value) {
              res.setHeader(key, value);
            }
          }
        }

        // Fazer pipe da resposta diretamente
        proxyRes.pipe(res as any);
      });

      // Callback customizado antes de enviar
      if (onProxyReq) {
        onProxyReq(proxyReq, req);
      }

      // Lidar com erros
      proxyReq.on("error", (err) => {
        if (onError) {
          onError(err, req, res);
        } else {
          logger("error", `[Proxy] Error: ${err.message}`);
          if (!res.headersSent) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: "Bad Gateway",
              message: "Failed to connect to upstream server",
            }));
          }
        }
      });

      proxyReq.on("timeout", () => {
        proxyReq.destroy();
        if (!res.headersSent) {
          res.statusCode = 504;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: "Gateway Timeout",
            message: "Upstream server took too long to respond",
          }));
        }
      });

      // Enviar body se existir
      if (req.body && ["POST", "PUT", "PATCH"].includes(req.method || "")) {
        const bodyStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        proxyReq.write(bodyStr);
      }

      proxyReq.end();
    } catch (err: any) {
      logger("error", `[Proxy] Setup error: ${err.message}`);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to setup proxy",
        }));
      }
    }
  };
}

/**
 * Middleware de proxy simples - apenas passa o target
 */
export function proxyPlugin(target: string, options: Partial<ProxyOptions> = {}) {
  return createProxyMiddleware({ target, ...options });
}
