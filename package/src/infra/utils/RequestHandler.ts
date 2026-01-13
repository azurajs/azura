import type { RequestServer } from "../../types/http/request.type";
import type { ResponseServer } from "../../types/http/response.type";

export type NextFunction = (err?: Error | unknown) => Promise<void>;

interface AdapterContext {
  request?: RequestServer;
  response?: ResponseServer;
  req?: RequestServer;
  res?: ResponseServer;
  next: NextFunction;
}

type MiddlewareFunction = (
  req: RequestServer,
  res: ResponseServer,
  next: (err?: Error | unknown) => void | Promise<void>
) => void | Promise<void>;

type HandlerFunction = (req: RequestServer, res: ResponseServer) => void | Promise<void>;

type ModernHandlerFunction = (ctx: {
  req: RequestServer;
  res: ResponseServer;
  next: NextFunction;
}) => void | Promise<void>;

type GenericHandler =
  | MiddlewareFunction
  | HandlerFunction
  | ModernHandlerFunction
  | ((ctx: AdapterContext) => void | Promise<void>)
  | Function;

export function adaptRequestHandler(mw: GenericHandler) {
  if (typeof mw !== "function") return mw;

  return async (ctx: AdapterContext): Promise<void> => {
    try {
      const req = ctx.request || ctx.req;
      const res = ctx.response || ctx.res;

      if (!req || !res) {
        throw new Error("Request or Response object is undefined");
      }

      if (mw.length === 3) {
        let nextCalled = false;

        const result = (mw as MiddlewareFunction)(req, res, async (err?: Error | unknown) => {
          if (nextCalled) return;
          nextCalled = true;

          if (err) throw err;

          if (ctx.next) {
            await ctx.next();
          }
        });

        if (result && typeof (result as Promise<void>).then === "function") {
          await result;
        }

        return;
      }

      if (mw.length === 2) {
        const result = (mw as HandlerFunction)(req, res);
        if (result && typeof (result as Promise<void>).then === "function") {
          await result;
        }
        return;
      }

      if (mw.length === 1) {
        await (mw as ModernHandlerFunction)({
          req,
          res,
          next: ctx.next,
        });
        return;
      }

      await (mw as Function)(ctx);
    } catch (err) {
      throw err;
    }
  };
}
