import type {
  CDNEvent,
  CDNEventHandler,
  CDNEventType,
} from "./types/common.js";

export class CDNEventEmitter {
  private handlers: Map<CDNEventType, Set<CDNEventHandler>> = new Map();

  on(event: CDNEventType, handler: CDNEventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: CDNEventType, handler: CDNEventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(
    type: CDNEventType,
    data?: Partial<Omit<CDNEvent, "type" | "timestamp">>,
  ): void {
    const event: CDNEvent = {
      type,
      timestamp: Date.now(),
      ...data,
    };

    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (e) {
          console.error(`[CDN] Event handler error for ${type}:`, e);
        }
      });
    }
  }

  removeAllListeners(event?: CDNEventType): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  listenerCount(event: CDNEventType): number {
    return this.handlers.get(event)?.size || 0;
  }
}
