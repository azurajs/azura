import type { RequestHandler } from "../types";
import type { InternalHandler } from "../types/common.type";
import { Node } from "./utils/route/Node";

interface MatchResult {
  handler: InternalHandler;
  params: Record<string, string>;
}

export class Router {
  private root = new Node();
  private staticRoutes = new Map<string, Record<string, InternalHandler>>();
  private middlewares: RequestHandler[] = [];
  private debug: boolean;

  constructor(debug = false) {
    this.debug = debug;
  }

  add(method: string, path: string, handler: InternalHandler): void {
    const upperMethod = method.toUpperCase();

    if (this.debug) {
      console.log(`[Router:DEBUG] Adding ${upperMethod} ${path}`);
    }

    if (!path.includes(":")) {
      let methodMap = this.staticRoutes.get(path);
      if (!methodMap) {
        methodMap = Object.create(null) as Record<string, InternalHandler>;
        this.staticRoutes.set(path, methodMap);
      }
      methodMap[upperMethod] = handler;

      if (this.debug) {
        console.log(`[Router:DEBUG] Added as static optimized route: ${path}`);
      }
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
            if (this.debug) {
              console.log(`[Router:DEBUG] Created param node: :${node.paramNode.paramName}`);
            }
          }
          node = node.paramNode;
        } else {
          if (!node.children[segment]) {
            node.children[segment] = new Node();
            if (this.debug) {
              console.log(`[Router:DEBUG] Created literal node: "${segment}"`);
            }
          }
          node = node.children[segment];
        }
      }
    }

    node.handlers[upperMethod] = handler;

    if (this.debug) {
      console.log(`[Router:DEBUG] Handler set for ${upperMethod} at tree leaf`);
    }
  }

  public find(method: string, path: string): MatchResult | null {
    const upperMethod = method.toUpperCase();
    const qIdx = path.indexOf("?");
    const cleanPath = qIdx === -1 ? path : path.substring(0, qIdx);

    if (this.debug) {
      console.log(`[Router:DEBUG] Finding ${upperMethod} ${cleanPath}`);
    }

    const staticEntry = this.staticRoutes.get(cleanPath);
    if (staticEntry && staticEntry[upperMethod]) {
      if (this.debug) console.log(`[Router:DEBUG] Static route hit: ${cleanPath}`);
      return { handler: staticEntry[upperMethod], params: Object.create(null) };
    }

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
          if (this.debug) {
            console.log(`[Router:DEBUG] Matched literal segment: "${segment}"`);
          }
        } else if (node.paramNode) {
          node = node.paramNode;
          params[node.paramName] = segment;
          if (this.debug) {
            console.log(
              `[Router:DEBUG] Matched param segment: ":${node.paramName}" = "${segment}"`,
            );
          }
        } else {
          if (this.debug) {
            console.log(`[Router:DEBUG] No matching child for segment: "${segment}"`);
          }
          return null;
        }
      }
    }

    const handler = node.handlers[upperMethod];
    if (!handler) {
      if (this.debug) {
        console.log(`[Router:DEBUG] No handler for method ${upperMethod} at ${cleanPath}`);
      }
      return null;
    }

    if (this.debug) {
      console.log(`[Router:DEBUG] Found handler. Params:`, params);
    }

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

  public use(prefix: string, router: Router): void;
  public use(_arg: unknown): void;
  public use(prefixOrMw: string | unknown, router?: Router): void {
    if (typeof prefixOrMw === "string" && router instanceof Router) {
      const prefix = prefixOrMw.endsWith("/") ? prefixOrMw.slice(0, -1) : prefixOrMw;
      const routes = router.listRoutes();
      for (const r of routes) {
        const found = router.find(r.method, r.path);
        if (!found) continue;
        const fullPath = prefix + (r.path === "/" ? "" : r.path);
        this.add(r.method, fullPath, found.handler);
      }
    }
  }
}
