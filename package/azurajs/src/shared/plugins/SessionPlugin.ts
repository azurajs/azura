import type { RequestHandler } from "../../types/common.type";

interface SessionData {
  [key: string]: any;
}

interface SessionStore {
  get: (id: string) => Promise<SessionData | null>;
  set: (id: string, data: SessionData) => Promise<void>;
  destroy: (id: string) => Promise<void>;
}

class MemoryStore implements SessionStore {
  private store = new Map<string, { data: SessionData; expires: number }>();

  async get(id: string): Promise<SessionData | null> {
    const entry = this.store.get(id);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
      this.store.delete(id);
      return null;
    }
    return entry.data;
  }

  async set(id: string, data: SessionData): Promise<void> {
    const expires = Date.now() + 86400000;
    this.store.set(id, { data, expires });
  }

  async destroy(id: string): Promise<void> {
    this.store.delete(id);
  }
}

interface SessionOptions {
  secret: string;
  name?: string;
  cookie?: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  };
  store?: SessionStore;
  rolling?: boolean;
  resave?: boolean;
  saveUninitialized?: boolean;
}

export function session(options: SessionOptions): RequestHandler {
  const name = options.name || "sid";
  const store = options.store || new MemoryStore();
  const maxAge = options.cookie?.maxAge || 86400000;
  const httpOnly = options.cookie?.httpOnly ?? true;
  const secure = options.cookie?.secure ?? false;
  const sameSite = options.cookie?.sameSite || "lax";
  const rolling = options.rolling ?? false;
  const resave = options.resave ?? true;
  const saveUninitialized = options.saveUninitialized ?? true;

  const generateId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  return async (req, res, next) => {
    let sessionId = req.cookies?.[name];
    let sessionData: SessionData | null = null;

    if (sessionId) {
      sessionData = await store.get(sessionId);
    }

    if (!sessionData) {
      sessionId = generateId();
      sessionData = {};
    }

    const sessionProxy = new Proxy(sessionData, {
      set: (target, prop, value) => {
        (target as any)[prop] = value;
        return true;
      },
      deleteProperty: (target, prop) => {
        delete (target as any)[prop];
        return true;
      },
    });

    (req as any).session = sessionProxy;
    (req as any).sessionID = sessionId;

    const originalEnd = res.end;
    (res as any).end = async function (...args: any[]) {
      const shouldSave = saveUninitialized || Object.keys(sessionData!).length > 0;

      if (shouldSave && (resave || Object.keys(sessionData!).length > 0)) {
        await store.set(sessionId!, sessionData!);

        // Só definir cookie se os headers ainda não foram enviados
        if (!res.headersSent) {
          res.cookie(name, sessionId!, {
            maxAge,
            httpOnly,
            secure,
            sameSite,
          });
        }
      }

      if (!res.headersSent) {
        return originalEnd.call(this, args[0], args[1] as BufferEncoding, args[2] as (() => void) | undefined);
      }
    };

    (req as any).session.destroy = async () => {
      await store.destroy(sessionId!);
      if (!res.headersSent) {
        res.clearCookie(name);
      }
    };

    (req as any).session.regenerate = async () => {
      await store.destroy(sessionId!);
      sessionId = generateId();
      (req as any).sessionID = sessionId;
      sessionData = {};
      (req as any).session = sessionProxy;
    };

    return next ? next() : Promise.resolve();
  };
}
