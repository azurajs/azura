import type { AzuraClient } from "../infra/Server";
import type { RequestServer } from "../types/http/request.type";
import type { ResponseServer } from "../types/http/response.type";
import type { ParamDefinition, ParamSource, RouteDefinition } from "../types/routes.type";

const AZURA = {
  PREFIX: "__azura_prefix__",
  ROUTES: "__azura_routes__",
  PARAMS: "__azura_params__",
  DESCRIPTIONS: "__azura_descriptions__",
};

export function Controller(prefix = ""): ClassDecorator {
  return (target) => {
    (target as any)[AZURA.PREFIX] = prefix;
    if (!(target as any)[AZURA.ROUTES]) (target as any)[AZURA.ROUTES] = [];
    if (!(target as any)[AZURA.PARAMS])
      (target as any)[AZURA.PARAMS] = new Map<string, ParamDefinition[]>();
    if (!(target as any)[AZURA.DESCRIPTIONS])
      (target as any)[AZURA.DESCRIPTIONS] = new Map<string, string>();
  };
}

export function Description(description: string): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
    if (!ctor[AZURA.DESCRIPTIONS]) ctor[AZURA.DESCRIPTIONS] = new Map<string, string>();
    ctor[AZURA.DESCRIPTIONS].set(String(propertyKey), description);
  };
}

function createMethodDecorator(method: string) {
  return function (path = ""): MethodDecorator {
    return (target, propertyKey) => {
      const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
      if (!ctor[AZURA.ROUTES]) ctor[AZURA.ROUTES] = [];
      if (!ctor[AZURA.PARAMS]) ctor[AZURA.PARAMS] = new Map<string, ParamDefinition[]>();
      if (!ctor[AZURA.DESCRIPTIONS]) ctor[AZURA.DESCRIPTIONS] = new Map<string, string>();
      const key = String(propertyKey);
      const params = ctor[AZURA.PARAMS].get(key) ?? [];
      const description = ctor[AZURA.DESCRIPTIONS].get(key);
      const exists = ctor[AZURA.ROUTES].some(
        (r: RouteDefinition) => r.method === method && r.path === path && r.propertyKey === key,
      );
      if (!exists) {
        ctor[AZURA.ROUTES].push({
          method,
          path,
          propertyKey: key,
          params,
          description,
        } as RouteDefinition);
      }
    };
  };
}

function createParamDecorator(type: ParamSource) {
  return function (name?: string): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
      const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
      if (!ctor[AZURA.PARAMS]) ctor[AZURA.PARAMS] = new Map<string, ParamDefinition[]>();
      const key = String(propertyKey);
      const list = ctor[AZURA.PARAMS].get(key) ?? [];
      const exists = list.some(
        (p: ParamDefinition) => p.index === parameterIndex && p.type === type && p.name === name,
      );
      if (!exists) {
        list.push({
          index: parameterIndex,
          type,
          name,
        } as ParamDefinition);
        ctor[AZURA.PARAMS].set(key, list);
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
    const prefix = (ControllerClass as any)[AZURA.PREFIX] ?? "";
    const routes: RouteDefinition[] = (ControllerClass as any)[AZURA.ROUTES] ?? [];
    const instance = new ControllerClass();
    routes.forEach((r) => {
      const handler = async (
        req: RequestServer,
        res: ResponseServer,
        next?: (err?: unknown) => void,
      ) => {
        try {
          const params = (r.params ?? []).slice();
          const maxParamIndex = params.length > 0 ? Math.max(...params.map((p) => p.index)) : -1;
          const minArgs = 3;
          const argsLength = Math.max(maxParamIndex + 1, minArgs);
          const args: unknown[] = new Array(argsLength).fill(undefined);
          args[0] = req;
          args[1] = res;
          args[2] = next;
          for (const p of params) {
            let value: unknown = undefined;
            switch (p.type) {
              case "req":
                value = req;
                break;
              case "res":
                value = res;
                break;
              case "next":
                value = next;
                break;
              case "param":
                value = p.name ? (req.params as Record<string, any>)[p.name] : req.params;
                break;
              case "query":
                value = p.name ? (req.query as Record<string, any>)[p.name] : req.query;
                break;
              case "body": {
                const body = req.body as Record<string, unknown> | undefined;
                value = p.name ? body?.[p.name] : body;
                break;
              }
              case "headers":
                value = p.name ? req.headers[p.name.toLowerCase()] : req.headers;
                break;
              case "ip":
                value = req.ip;
                break;
              case "useragent":
                value = req.headers["user-agent"];
                break;
              default:
                value = undefined;
            }
            args[p.index] = value;
          }
          const fn = (instance as Record<string, unknown>)[r.propertyKey] as (
            ...args: unknown[]
          ) => unknown;
          const result = fn.apply(instance, args);
          if (result instanceof Promise) await result;
        } catch (err) {
          if (next) next(err);
        }
      };
      app.addRoute(r.method, prefix + r.path, handler);
    });
  });
}

export function getControllerMetadata(ControllerClass: Function) {
  return {
    prefix: (ControllerClass as any)[AZURA.PREFIX] || "",
    routes: (ControllerClass as any)[AZURA.ROUTES] || [],
    params: (ControllerClass as any)[AZURA.PARAMS] || new Map<string, ParamDefinition[]>(),
    descriptions: (ControllerClass as any)[AZURA.DESCRIPTIONS] || new Map<string, string>(),
  };
}
