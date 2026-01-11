import { HttpError } from "./utils/HttpError";
import { Node, type Handler } from "./utils/route/Node";

interface MatchResult {
  handlers: Handler[];
  params: Record<string, string>;
}

export class Router {
  private root = new Node();
  private debug?: boolean;

  constructor(debug = false) {
    this.debug = debug;
  }

  add(method: string, path: string, ...handlers: Handler[]) {
    const segments = path.split("/").filter(Boolean);
    let node = this.root;

    for (const seg of segments) {
      let child: Node;

      if (seg.startsWith(":")) {
        child = new Node();
        child.isParam = true;
        child.paramName = seg.slice(1);
      } else {
        child = node.children.get(seg) ?? new Node();
      }

      node.children.set(seg.startsWith(":") ? ":" : seg, child);
      node = child;
    }

    node.handlers.set(method.toUpperCase(), handlers);
  }

  find(method: string, path: string): MatchResult {
    const cleanPath = path.split("?")[0];
    const segments = cleanPath?.split("/").filter(Boolean) ?? [];
    let node = this.root;
    const params: Record<string, string> = {};

    if (this.debug && segments?.length === 0 && node.handlers.size === 0) {
      console.error("[Router:DEBUG] Root node has no handlers");
      console.error("[Router:DEBUG] Available methods at root:", Array.from(node.handlers.keys()));
    }

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg) continue;

      let child = node.children.get(seg);

      if (child) {
        node = child;
      } else {
        child = node.children.get(":");
        if (child) {
          node = child;
          if (node.paramName) {
            params[node.paramName] = seg;
          }
        } else {
          // Debug melhorado - só mostra se debug estiver ativo
          if (this.debug) {
            console.error(`[Router:DEBUG] Route not found for ${method} ${cleanPath}`);
            console.error(`[Router:DEBUG] Failed at segment: "${seg}"`);
            console.error(`[Router:DEBUG] Available children:`, Array.from(node.children.keys()));
          }
          throw new HttpError(404, "Route not found");
        }
      }
    }

    const handlers = node.handlers.get(method.toUpperCase()) as Handler[];
    if (!handlers) {
      if (this.debug) {
        console.error(
          `[Router:DEBUG] No handlers for method ${method.toUpperCase()} at path ${cleanPath}`
        );
        console.error(
          `[Router:DEBUG] Available methods at this path:`,
          Array.from(node.handlers.keys())
        );
        console.error(`[Router:DEBUG] Segments matched:`, segments);
      }
      throw new HttpError(404, "Route not found");
    }
    return { handlers, params };
  }

  public listRoutes(): Array<{ method: string; path: string }> {
    const routes: Array<{ method: string; path: string }> = [];

    const traverse = (node: Node, path: string) => {
      if (node.handlers.size > 0) {
        for (const method of node.handlers.keys()) {
          routes.push({ method, path: path || "/" });
        }
      }

      for (const [segment, child] of node.children) {
        const newPath =
          path + "/" + (segment === ":" && child.paramName ? `:${child.paramName}` : segment);
        traverse(child, newPath);
      }
    };

    traverse(this.root, "");
    return routes;
  }
}
