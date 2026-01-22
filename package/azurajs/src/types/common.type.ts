import type { RequestServer } from "./http/request.type";
import type { ResponseServer } from "./http/response.type";

export type NextFunction = (err?: Error | unknown) => Promise<void>;
export type TraditionalHandler = (req: RequestServer, res: ResponseServer, next?: NextFunction) => void | Promise<void> | unknown;
export type DestructuredHandler = (ctx: { req: RequestServer; res: ResponseServer; next?: NextFunction }) => void | Promise<void> | unknown;

export type RequestHandler = TraditionalHandler | DestructuredHandler;
export type InternalHandler = (ctx: { req: RequestServer; res: ResponseServer; next?: NextFunction }) => Promise<void> | void;

export interface HttpContext {
  request: RequestServer;
  response: ResponseServer;
  next: NextFunction;
  body?: Buffer | string | unknown;
}