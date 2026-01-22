import type {
  RequestHandler,
  TraditionalHandler,
  DestructuredHandler,
  InternalHandler,
  NextFunction,
} from "../../types/common.type";
import type { RequestServer } from "../../types/http/request.type";
import type { ResponseServer } from "../../types/http/response.type";

export function adaptRequestHandler(mw: RequestHandler): InternalHandler {
  return async function adapted(ctx: {
    req: RequestServer;
    res: ResponseServer;
    next?: NextFunction;
  }) {
    const nextFn: NextFunction = (err?: unknown) => {
      if (err) {
        throw err;
      }
      if (ctx.next) return ctx.next();
      return Promise.resolve();
    };
    const len = (mw as Function).length;
    if (len >= 3) {
      const thr = mw as TraditionalHandler;
      await thr(ctx.req, ctx.res, nextFn);
      return;
    }
    if (len === 2 || len === 1) {
      const des = mw as DestructuredHandler;
      await des({ req: ctx.req, res: ctx.res, next: nextFn });
      return;
    }
    await (mw as Function)({
      request: ctx.req,
      response: ctx.res,
      req: ctx.req,
      res: ctx.res,
      next: nextFn,
    });
  };
}
