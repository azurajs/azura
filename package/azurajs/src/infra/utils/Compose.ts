import type { InternalHandler } from "../../types/common.type";


export function composeHandlers(handlers: ReadonlyArray<InternalHandler>): InternalHandler {
  return function composed(ctx) {
    let index = -1;

    function dispatch(i: number): Promise<void> {
      if (i <= index) {
        return Promise.reject(new Error("next() called multiple times"));
      }
      index = i;
      const fn = handlers[i];
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(
          fn({
            req: ctx.req,
            res: ctx.res,
            next: () => dispatch(i + 1),
          }),
        );
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}
