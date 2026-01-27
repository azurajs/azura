import crypto from "crypto";
import type { CacheEntry } from "../types/common.js";
import type http from "http";

export function generateETag(content: Buffer): string {
  const hash = crypto.createHash("md5").update(content).digest("hex");
  return `"${hash}"`;
}

export function generateWeakETag(content: Buffer, size: number): string {
  const hash = crypto
    .createHash("md5")
    .update(content.slice(0, Math.min(1024, size)))
    .digest("hex")
    .slice(0, 16);
  return `W/"${hash}-${size}"`;
}

export function parseIfNoneMatch(header: string | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((etag) => etag.trim())
    .filter(Boolean);
}

export function etagMatches(etag: string | undefined, ifNoneMatch: string | undefined): boolean {
  if (!etag || !ifNoneMatch) return false;

  if (ifNoneMatch.trim() === "*") return true;

  const clientEtags = parseIfNoneMatch(ifNoneMatch);

  const normalizedEtag = etag.replace(/^W\//, "");

  return clientEtags.some((clientEtag) => {
    const normalized = clientEtag.replace(/^W\//, "");
    return normalized === normalizedEtag;
  });
}

export function parseIfModifiedSince(header: string | undefined): number | null {
  if (!header) return null;
  const timestamp = Date.parse(header);
  return isNaN(timestamp) ? null : timestamp;
}

export function isModifiedSince(
  lastModified: number | undefined,
  ifModifiedSince: string | undefined,
): boolean {
  if (!lastModified || !ifModifiedSince) return true;

  const clientTime = parseIfModifiedSince(ifModifiedSince);
  if (!clientTime) return true;

  return Math.floor(lastModified / 1000) > Math.floor(clientTime / 1000);
}

export function formatHttpDate(timestamp: number): string {
  return new Date(timestamp).toUTCString();
}

export function shouldReturn304(req: http.IncomingMessage, entry: CacheEntry): boolean {
  const ifNoneMatch = req.headers["if-none-match"];
  const ifModifiedSince = req.headers["if-modified-since"];

  if (ifNoneMatch) {
    return etagMatches(entry.etag, ifNoneMatch as string);
  }

  if (ifModifiedSince && entry.lastModified) {
    return !isModifiedSince(entry.lastModified, ifModifiedSince as string);
  }

  return false;
}

export function addConditionalHeaders(
  entry: CacheEntry,
  headers: Record<string, string | string[]>,
): void {
  if (entry.etag) {
    headers["etag"] = entry.etag;
  }
  if (entry.lastModified) {
    headers["last-modified"] = formatHttpDate(entry.lastModified);
  }
}

export function create304Headers(entry: CacheEntry): Record<string, string> {
  const headers: Record<string, string> = {};

  if (entry.etag) {
    headers["etag"] = entry.etag;
  }
  if (entry.lastModified) {
    headers["last-modified"] = formatHttpDate(entry.lastModified);
  }
  const cacheControl = entry.headers["cache-control"];
  if (cacheControl) {
    headers["cache-control"] = Array.isArray(cacheControl)
      ? (cacheControl[0] ?? "")
      : (cacheControl ?? "");
  }

  return headers;
}
