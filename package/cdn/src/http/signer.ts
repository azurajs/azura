import crypto from "crypto";

export function generateSignedUrl(path: string, secret: string, ttlSeconds: number) {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const h = crypto
    .createHmac("sha256", secret)
    .update(path + "|" + String(expires))
    .digest("hex");
    
  return `${path}?expires=${expires}&sig=${h}`;
}

export function verifySignedQuery(path: string, secret: string, expiresStr?: string, sig?: string) {
  if (!expiresStr || !sig) return false;
  const expires = Number(expiresStr);
  if (Number.isNaN(expires)) return false;
  if (Math.floor(Date.now() / 1000) > expires) return false;

  const h = crypto
    .createHmac("sha256", secret)
    .update(path + "|" + String(expires))
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig));
}
