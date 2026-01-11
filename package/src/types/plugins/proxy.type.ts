import http from "node:http";
import type { RequestServer } from "../http/request.type";
import type { ResponseServer } from "../http/response.type";

export interface ProxyOptions {
  target: string;

  /**
   * Reescrever o path antes de fazer o proxy
   * @example
   * pathRewrite: { '^/api': '' } - Remove /api do início
   */
  pathRewrite?: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
  followRedirects?: boolean;
  preserveHost?: boolean;
  logLevel?: "none" | "info" | "debug";

  onProxyReq?: (proxyReq: http.ClientRequest, req: RequestServer) => void;
  onProxyRes?: (proxyRes: http.IncomingMessage, req: RequestServer, res: ResponseServer) => void;

  onError?: (err: Error, req: RequestServer, res: ResponseServer) => void;
}
