import crypto from "crypto";

export function generateSignedUrl(
  path: string,
  secret: string,
  ttlSeconds: number,
): string {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(path + "|" + String(expires))
    .digest("hex");

  return `${path}?expires=${expires}&sig=${hash}`;
}

export function verifySignedQuery(
  path: string,
  secret: string,
  expiresStr?: string,
  sig?: string,
): boolean {
  if (!expiresStr || !sig) return false;

  const expires = Number(expiresStr);
  if (Number.isNaN(expires)) return false;

  if (Math.floor(Date.now() / 1000) > expires) return false;

  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(path + "|" + String(expires))
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(sig));
  } catch (e) {
    return false;
  }
}
