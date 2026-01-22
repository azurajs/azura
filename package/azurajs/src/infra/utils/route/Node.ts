import type { InternalHandler } from "../../../types/common.type";

export class Node {
  children: Record<string, Node> = Object.create(null);
  paramNode: Node | null = null;
  handlers: Record<string, InternalHandler> = Object.create(null);
  paramName: string = "";
}