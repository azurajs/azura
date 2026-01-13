import type { AzuraClient } from "../infra/Server";
import type { RequestServer } from "../types/http/request.type";
import type { ResponseServer } from "../types/http/response.type";
import type { ParamDefinition, ParamSource, RouteDefinition } from "../types/routes.type";

const PREFIX = new WeakMap<Function, string>();
const ROUTES = new WeakMap<Function, RouteDefinition[]>();
const PARAMS = new WeakMap<Function, Map<string, ParamDefinition[]>>();
const DESCRIPTIONS = new WeakMap<Function, Map<string, string>>();

export function Controller(prefix = ""): ClassDecorator {
  return (target) => {
    PREFIX.set(target as Function, prefix);
  };
}

export function Description(description: string): MethodDecorator {
  return (target, propertyKey) => {
    const ctor =
      typeof target === "function" ? (target as Function) : (target as any).constructor;
    let map = DESCRIPTIONS.get(ctor);
    if (!map) {
      map = new Map<string, string>();
      DESCRIPTIONS.set(ctor, map);
    }
    map.set(String(propertyKey), description);
  };
}

function createMethodDecorator(method: string) {
  return function (path = ""): MethodDecorator {
    return (target, propertyKey) => {
      const ctor =
        typeof target === "function" ? (target as Function) : (target as any).constructor;
      const key = String(propertyKey);
      const routes = ROUTES.get(ctor) ?? [];
      const params = PARAMS.get(ctor)?.get(key) ?? [];
      const description = DESCRIPTIONS.get(ctor)?.get(key);

      const exists = routes.some(
        (r) => r.method === method && r.path === path && r.propertyKey === key
      );
      if (!exists) {
        routes.push({
          method,
          path,
          propertyKey: key,
          params,
          description,
        });
        ROUTES.set(ctor, routes);
      }
    };
  };
}

function createParamDecorator(type: ParamSource) {
  return function (name?: string): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
      const ctor =
        typeof target === "function" ? (target as Function) : (target as any).constructor;
      let map = PARAMS.get(ctor);
      if (!map) {
        map = new Map<string, ParamDefinition[]>();
        PARAMS.set(ctor, map);
      }

      const key = String(propertyKey);
      const list = map.get(key) ?? [];
      const exists = list.some(
        (p) => p.index === parameterIndex && p.type === type && p.name === name
      );
      if (!exists) {
        list.push({
          index: parameterIndex,
          type,
          name,
        });
        map.set(key, list);
      }
    };
  };
}

export const Get = createMethodDecorator("GET");
export const Post = createMethodDecorator("POST");
export const Put = createMethodDecorator("PUT");
export const Delete = createMethodDecorator("DELETE");
export const Patch = createMethodDecorator("PATCH");
export const Head = createMethodDecorator("HEAD");
export const Options = createMethodDecorator("OPTIONS");

export const Req = createParamDecorator("req");
export const Res = createParamDecorator("res");
export const Next = createParamDecorator("next");
export const Param = createParamDecorator("param");
export const Query = createParamDecorator("query");
export const Body = createParamDecorator("body");
export const Headers = createParamDecorator("headers");
export const Ip = createParamDecorator("ip");
export const UserAgent = createParamDecorator("useragent");

export function applyDecorators(app: AzuraClient, controllers: Array<new () => any>) {
  controllers.forEach((ControllerClass) => {
    const prefix = PREFIX.get(ControllerClass) ?? "";
    const instance = new ControllerClass();
    const routes = ROUTES.get(ControllerClass) ?? [];

    routes.forEach((r) => {
      const handler = async (
        req: RequestServer,
        res: ResponseServer,
        next?: (err?: unknown) => void
      ) => {
        try {
          const params = (r.params ?? []).slice().sort((a, b) => a.index - b.index);
          const args = params.map((p) => {
            switch (p.type) {
              case "req":
                return req;
              case "res":
                return res;
              case "next":
                return next;
              case "param":
                return p.name ? req.params[p.name] : req.params;
              case "query":
                return p.name ? req.query[p.name] : req.query;
              case "body": {
                const body = req.body as Record<string, unknown> | undefined;
                return p.name ? body?.[p.name] : body;
              }
              case "headers":
                return p.name ? req.headers[p.name.toLowerCase()] : req.headers;
              case "ip":
                return req.ip;
              case "useragent":
                return req.headers["user-agent"];
              default:
                return undefined;
            }
          });

          const fn = (instance as Record<string, unknown>)[r.propertyKey] as (
            ...args: unknown[]
          ) => unknown;
          const result = fn(...args);
          if (result instanceof Promise) await result;
        } catch (err) {
          if (next) next(err);
        }
      };

      app.addRoute(r.method, prefix + r.path, handler);
    });
  });
}
