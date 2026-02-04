import type { RequestHandler } from "../../types/common.type";

interface HelmetOptions {
  contentSecurityPolicy?: boolean | Record<string, string[]>;
  dnsPrefetchControl?: boolean | { allow?: boolean };
  frameguard?: boolean | { action?: "deny" | "sameorigin" };
  hidePoweredBy?: boolean;
  hsts?: boolean | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean };
  ieNoOpen?: boolean;
  noSniff?: boolean;
  referrerPolicy?: boolean | { policy?: string };
  xssFilter?: boolean;
}

export function helmet(options: HelmetOptions = {}): RequestHandler {
  return (req, res, next) => {
    if (options.hidePoweredBy !== false) {
      res.removeHeader("X-Powered-By");
    }

    if (options.noSniff !== false) {
      res.set("X-Content-Type-Options", "nosniff");
    }

    if (options.xssFilter !== false) {
      res.set("X-XSS-Protection", "1; mode=block");
    }

    if (options.ieNoOpen !== false) {
      res.set("X-Download-Options", "noopen");
    }

    const frameguard = options.frameguard !== false;
    if (frameguard) {
      const action =
        typeof options.frameguard === "object" ? options.frameguard.action : "sameorigin";
      res.set("X-Frame-Options", action === "deny" ? "DENY" : "SAMEORIGIN");
    }

    const dnsPrefetchControl = options.dnsPrefetchControl !== false;
    if (dnsPrefetchControl) {
      const allow =
        typeof options.dnsPrefetchControl === "object" ? options.dnsPrefetchControl.allow : false;
      res.set("X-DNS-Prefetch-Control", allow ? "on" : "off");
    }

    const hsts = options.hsts !== false;
    if (hsts) {
      const maxAge = typeof options.hsts === "object" ? options.hsts.maxAge || 15552000 : 15552000;
      const includeSubDomains =
        typeof options.hsts === "object" ? options.hsts.includeSubDomains : true;
      const preload = typeof options.hsts === "object" ? options.hsts.preload : false;

      let value = `max-age=${maxAge}`;
      if (includeSubDomains) value += "; includeSubDomains";
      if (preload) value += "; preload";

      res.set("Strict-Transport-Security", value);
    }

    const referrerPolicy = options.referrerPolicy !== false;
    if (referrerPolicy) {
      const policy =
        typeof options.referrerPolicy === "object" ? options.referrerPolicy.policy : "no-referrer";
      res.set("Referrer-Policy", policy || "no-referrer");
    }

    const csp = options.contentSecurityPolicy !== false;
    if (csp) {
      const directives =
        typeof options.contentSecurityPolicy === "object"
          ? options.contentSecurityPolicy
          : {
              "default-src": ["'self'"],
              "base-uri": ["'self'"],
              "font-src": ["'self'", "https:", "data:"],
              "form-action": ["'self'"],
              "frame-ancestors": ["'self'"],
              "img-src": ["'self'", "data:"],
              "object-src": ["'none'"],
              "script-src": ["'self'"],
              "script-src-attr": ["'none'"],
              "style-src": ["'self'", "https:", "'unsafe-inline'"],
              "upgrade-insecure-requests": [],
            };

      const cspString = Object.entries(directives)
        .map(([key, values]) => {
          if (values.length === 0) return key;
          return `${key} ${values.join(" ")}`;
        })
        .join("; ");

      res.set("Content-Security-Policy", cspString);
    }

    return next ? next() : Promise.resolve();
  };
}
