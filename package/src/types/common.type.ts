import type { NextFunction } from "../infra/utils/RequestHandler";
import type { RequestServer } from "./http/request.type";
import type { ResponseServer } from "./http/response.type";

type TraditionalHandler = (req: RequestServer, res: ResponseServer, next?: NextFunction) => void | Promise<void> | unknown;
type DestructuredHandler = (ctx: { req: RequestServer; res: ResponseServer; next?: NextFunction }) => void | Promise<void> | unknown;

export type RequestHandler = TraditionalHandler | DestructuredHandler;

export interface HttpContext {
  request: RequestServer;
  response: ResponseServer;
  body?: Buffer | string | unknown;
}