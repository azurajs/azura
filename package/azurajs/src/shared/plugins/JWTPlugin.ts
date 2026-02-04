import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "../../types/common.type";

interface JWTPayload {
  [key: string]: any;
  exp?: number;
  iat?: number;
  nbf?: number;
}

interface JWTOptions {
  secret: string;
  algorithm?: "HS256" | "HS384" | "HS512";
  expiresIn?: number;
  issuer?: string;
  audience?: string;
}

interface JWTMiddlewareOptions extends JWTOptions {
  credentialsRequired?: boolean;
  getToken?: (req: any) => string | null;
}

function base64UrlEncode(str: Buffer | string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString();
}

function sign(payload: string, secret: string, algorithm: string): string {
  const alg = algorithm.replace("HS", "sha");
  return createHmac(alg, secret).update(payload).digest("base64url");
}

function verify(token: string, signature: string, secret: string, algorithm: string): boolean {
  const alg = algorithm.replace("HS", "sha");
  const expected = createHmac(alg, secret).update(token).digest("base64url");

  if (expected.length !== signature.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function createJWT(payload: JWTPayload, options: JWTOptions): string {
  const algorithm = options.algorithm || "HS256";
  const header = { alg: algorithm, typ: "JWT" };

  const now = Math.floor(Date.now() / 1000);
  const finalPayload = { ...payload };

  if (options.expiresIn) {
    finalPayload.exp = now + options.expiresIn;
  }

  if (options.issuer) {
    finalPayload.iss = options.issuer;
  }

  if (options.audience) {
    finalPayload.aud = options.audience;
  }

  if (!finalPayload.iat) {
    finalPayload.iat = now;
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(finalPayload));
  const token = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(token, options.secret, algorithm);

  return `${token}.${signature}`;
}

export function verifyJWT(
  token: string,
  secret: string,
  algorithm: string = "HS256",
): JWTPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  if (!verify(`${encodedHeader}.${encodedPayload}`, signature, secret, algorithm)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null;
    }

    if (payload.nbf && payload.nbf > now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function jwtMiddleware(options: JWTMiddlewareOptions): RequestHandler {
  const credentialsRequired = options.credentialsRequired ?? true;
  const getToken =
    options.getToken ||
    ((req: any) => {
      const auth = req.headers?.authorization;
      if (auth && auth.startsWith("Bearer ")) {
        return auth.substring(7);
      }
      return null;
    });

  return (req, res, next) => {
    const token = getToken(req);

    if (!token) {
      if (credentialsRequired) {
        res.status(401).json({ error: "No token provided" });
        return;
      }
      (req as any).user = null;
      return next ? next() : Promise.resolve();
    }

    const payload = verifyJWT(token, options.secret, options.algorithm);

    if (!payload) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    if (options.issuer && payload.iss !== options.issuer) {
      res.status(401).json({ error: "Invalid issuer" });
      return;
    }

    if (options.audience && payload.aud !== options.audience) {
      res.status(401).json({ error: "Invalid audience" });
      return;
    }

    (req as any).user = payload;
    (req as any).token = token;

    return next ? next() : Promise.resolve();
  };
}
