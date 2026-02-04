import { randomBytes, createHash } from "node:crypto";
import type { RequestHandler } from "../../types/common.type";

interface CSRFOptions {
  cookieName?: string;
  headerName?: string;
  ignoreMethods?: string[];
  ignorePaths?: string[];
  saltLength?: number;
  secretLength?: number;
}

const tokenCache = new Map<string, { token: string; expires: number }>();

export function csrf(options: CSRFOptions = {}): RequestHandler {
  const cookieName = options.cookieName || "_csrf";
  const headerName = options.headerName || "x-csrf-token";
  const ignoreMethods = options.ignoreMethods || ["GET", "HEAD", "OPTIONS"];
  const ignorePaths = options.ignorePaths || [];
  const saltLength = options.saltLength || 8;
  const secretLength = options.secretLength || 18;

  const generateSecret = (): string => {
    return randomBytes(secretLength).toString("base64");
  };

  const generateToken = (secret: string): string => {
    const salt = randomBytes(saltLength).toString("base64");
    const hash = createHash("sha256")
      .update(salt + secret)
      .digest("base64");
    return `${salt}.${hash}`;
  };

  const verifyToken = (token: string, secret: string): boolean => {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [salt, hash] = parts;
    const expectedHash = createHash("sha256")
      .update(salt + secret)
      .digest("base64");

    return hash === expectedHash;
  };

  return (req, res, next) => {
    let secret = req.cookies?.[cookieName];

    if (!secret) {
      secret = generateSecret();
      res.cookie(cookieName, secret, {
        httpOnly: true,
        sameSite: "strict",
        secure: req.protocol === "https",
        maxAge: 3600000,
      });
    }

    const token = generateToken(secret);

    (req as any).csrfToken = () => token;

    if (ignoreMethods.includes(req.method || "GET")) {
      return next ? next() : Promise.resolve();
    }

    // Check if path should be ignored
    if (ignorePaths.some(path => req.path?.startsWith(path))) {
      return next ? next() : Promise.resolve();
    }

    const submittedToken =
      (req.headers?.[headerName] as string | undefined) ||
      (req.body && typeof req.body === "object" && "_csrf" in req.body
        ? ((req.body as Record<string, unknown>)._csrf as string)
        : undefined) ||
      (req.query && typeof req.query === "object" && "_csrf" in req.query
        ? ((req.query as Record<string, unknown>)._csrf as string)
        : undefined);

    if (!submittedToken || !verifyToken(submittedToken as string, secret)) {
      res.status(403).json({ error: "Invalid CSRF token" });
      return;
    }

    return next ? next() : Promise.resolve();
  };
}
