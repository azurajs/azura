import type { RequestHandler } from "../types";
import type { InternalHandler } from "../types/common.type";
import { Node } from "./utils/route/Node";
import { composeHandlers } from "./utils/Compose";

interface MatchResult {
  handler: InternalHandler;
  params: Record<string, string>;
}

function adaptRouterHandler(handler: RequestHandler): InternalHandler {
  return async (ctx) => {
    if (typeof handler !== "function") return;
    if (handler.length > 1) {
      return (handler as any)(ctx.req, ctx.res, ctx.next);
    } else {
      return (handler as any)(ctx);
    }
  };
}

export class Router {
  private root = new Node();
  private staticRoutes = new Map<string, Record<string, InternalHandler>>();
  private debug: boolean;
  private middlewares: InternalHandler[] = [];

  constructor(debug = false) {
    this.debug = debug;
  }

  private insert(method: string, path: string, handler: InternalHandler): void {
    const upperMethod = method.toUpperCase();

    if (this.debug) {
      console.log(`[Router:DEBUG] Inserting compiled handler for ${upperMethod} ${path}`);
    }

    // Otimização: Se não tem parâmetros, adiciona ao mapa estático para acesso O(1)
    if (!path.includes(":")) {
      let methodMap = this.staticRoutes.get(path);
      if (!methodMap) {
        methodMap = Object.create(null) as Record<string, InternalHandler>;
        this.staticRoutes.set(path, methodMap);
      }
      methodMap[upperMethod] = handler;

      // IMPORTANTE: Não damos 'return' aqui.
      // Precisamos continuar para inserir na árvore também,
      // senão o listRoutes() não consegue encontrar essa rota para clonar em sub-routers.
    }

    let node = this.root;
    let start = 0;
    const len = path.length;
    for (let i = 0; i <= len; i++) {
      const ch = path.charCodeAt(i);
      if (ch === 47 || i === len) {
        const segment = path.substring(start, i);
        start = i + 1;
        if (!segment) continue;

        if (segment.startsWith(":")) {
          if (!node.paramNode) {
            node.paramNode = new Node();
            node.paramNode.paramName = segment.slice(1);
          }
          node = node.paramNode;
        } else {
          if (!node.children[segment]) {
            node.children[segment] = new Node();
          }
          node = node.children[segment];
        }
      }
    }
    node.handlers[upperMethod] = handler;
  }

  public add(method: string, path: string, handler: InternalHandler): void {
    const composed =
      this.middlewares.length > 0 ? composeHandlers([...this.middlewares, handler]) : handler;

    this.insert(method, path, composed);
  }

  public find(method: string, path: string): MatchResult | null {
    const upperMethod = method.toUpperCase();
    const qIdx = path.indexOf("?");
    const cleanPath = qIdx === -1 ? path : path.substring(0, qIdx);

    // 1. Tenta otimização estática primeiro (O(1))
    const staticEntry = this.staticRoutes.get(cleanPath);
    if (staticEntry && staticEntry[upperMethod]) {
      return { handler: staticEntry[upperMethod], params: Object.create(null) };
    }

    // 2. Se falhar, busca na árvore (Radix Tree)
    let node = this.root;
    const params: Record<string, string> = Object.create(null);

    let start = 0;
    if (cleanPath.length > 0 && cleanPath.charCodeAt(0) === 47) start = 1;

    const len = cleanPath.length;
    for (let i = start; i <= len; i++) {
      const ch = cleanPath.charCodeAt(i);
      if (ch === 47 || i === len) {
        const segment = cleanPath.substring(start, i);
        start = i + 1;
        if (!segment) continue;

        const nextNode = node.children[segment];
        if (nextNode) {
          node = nextNode;
        } else if (node.paramNode) {
          node = node.paramNode;
          params[node.paramName] = segment;
        } else {
          return null;
        }
      }
    }

    const handler = node.handlers[upperMethod];
    if (!handler) return null;

    return { handler, params };
  }

  public listRoutes(): Array<{ method: string; path: string }> {
    const routes: Array<{ method: string; path: string }> = [];

    const traverse = (node: Node, currentPath: string) => {
      const methods = Object.keys(node.handlers);
      for (const method of methods) {
        routes.push({ method, path: currentPath || "/" });
      }

      for (const key in node.children) {
        const childNode = node.children[key];
        if (childNode) {
          traverse(childNode, currentPath + "/" + key);
        }
      }

      if (node.paramNode) {
        traverse(node.paramNode, currentPath + "/:" + node.paramNode.paramName);
      }
    };

    traverse(this.root, "");
    return routes;
  }

  public use(prefix: string, mw: RequestHandler): void;
  public use(mw: RequestHandler): void;
  public use(prefix: string, router: Router): void;
  public use(prefixOrMw: string | RequestHandler, routerOrMw?: Router | RequestHandler): void {
    if (typeof prefixOrMw === "function") {
      this.middlewares.push(adaptRouterHandler(prefixOrMw));
    } else if (typeof prefixOrMw === "string" && routerOrMw instanceof Router) {
      const prefix = prefixOrMw.endsWith("/") ? prefixOrMw.slice(0, -1) : prefixOrMw;
      const routes = routerOrMw.listRoutes();

      for (const r of routes) {
        // Encontra o handler original no router filho
        const found = routerOrMw.find(r.method, r.path);
        if (!found) continue;

        const fullPath = prefix + (r.path === "/" ? "" : r.path);

        // Aplica os middlewares DESTE router (pai) sobre o handler que já veio do filho
        const finalHandler =
          this.middlewares.length > 0
            ? composeHandlers([...this.middlewares, found.handler])
            : found.handler;

        this.insert(r.method, fullPath, finalHandler);
      }
    } else if (typeof prefixOrMw === "string" && typeof routerOrMw === "function") {
      const prefix = prefixOrMw;
      const mw = adaptRouterHandler(routerOrMw as RequestHandler);

      const wrapper: InternalHandler = async (ctx) => {
        if (ctx.req.path && ctx.req.path.startsWith(prefix)) {
          return mw(ctx);
        }
        return ctx.next ? ctx.next() : Promise.resolve();
      };

      this.middlewares.push(wrapper);
    }
  }

  public get(path: string, ...handlers: RequestHandler[]): void {
    const internalHandlers = handlers.map(adaptRouterHandler);
    this.add("GET", path, composeHandlers(internalHandlers));
  }

  public post(path: string, ...handlers: RequestHandler[]): void {
    const internalHandlers = handlers.map(adaptRouterHandler);
    this.add("POST", path, composeHandlers(internalHandlers));
  }

  public put(path: string, ...handlers: RequestHandler[]): void {
    const internalHandlers = handlers.map(adaptRouterHandler);
    this.add("PUT", path, composeHandlers(internalHandlers));
  }

  public delete(path: string, ...handlers: RequestHandler[]): void {
    const internalHandlers = handlers.map(adaptRouterHandler);
    this.add("DELETE", path, composeHandlers(internalHandlers));
  }

  public patch(path: string, ...handlers: RequestHandler[]): void {
    const internalHandlers = handlers.map(adaptRouterHandler);
    this.add("PATCH", path, composeHandlers(internalHandlers));
  }
}
