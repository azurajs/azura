import type { RequestServer } from "./http/request.type";
import type { ResponseServer } from "./http/response.type";

export type RequestHandler = (req: RequestServer, res: ResponseServer, next: (err?: Error | any) => void) => void;
export interface HttpContext {
  request: RequestServer;
  response: ResponseServer;
  body?: Buffer | string;
}