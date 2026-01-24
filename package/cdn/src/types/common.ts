export interface CacheEntry {
  key: string;
  body: Buffer;
  headers: Record<string, string | string[]>;
  expiresAt: number;
  size: number;
  etag?: string;
  lastModified?: number;
  compressed?: {
    gzip?: Buffer;
    brotli?: Buffer;
  };
  tags?: string[];
  createdAt: number;
}

export interface ICacheBackend {
  get(key: string): Promise<CacheEntry | null> | CacheEntry | null;
  set(key: string, entry: CacheEntry): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  has(key: string): Promise<boolean> | boolean;
  clear(): Promise<void> | void;
  keys(): Promise<string[]> | string[];
  getStats(): Promise<CacheStats> | CacheStats;
}

export interface CacheStats {
  entries: number;
  currentBytes: number;
  maxBytes: number;
  usagePercent: string;
}

export interface CDNMetrics {
  hits: {
    memory: number;
    disk: number;
    redis?: number;
  };
  misses: number;
  errors: number;
  bytesServed: number;
  bytesSaved: number;
  requests: number;
  avgLatencyMs: number;
  uptime: number;
  startedAt: number;
}

export type CDNEventType =
  | "hit"
  | "miss"
  | "purge"
  | "error"
  | "warm"
  | "expire"
  | "compress";

export interface CDNEvent {
  type: CDNEventType;
  key?: string;
  source?: "memory" | "disk" | "redis";
  timestamp: number;
  data?: any;
}

export type CDNEventHandler = (event: CDNEvent) => void;

export interface CompressionOptions {
  enabled?: boolean;
  gzip?: boolean;
  brotli?: boolean;
  minSize?: number;
  mimeTypes?: string[];
}

export interface RateLimitOptions {
  enabled?: boolean;
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: any) => string;
}

export interface SignedUrlsOptions {
  secret: string;
  defaultTtl?: number;
  pathPrefix?: string;
}

export interface DiskCacheOptions {
  enabled?: boolean;
  path?: string;
  maxSizeBytes?: number;
}

export interface RedisCacheOptions {
  enabled?: boolean;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
}

export interface ServerOptions {
  port?: number;
  host?: string;
  trustProxy?: boolean;
}

export interface CDNConfig {
  origin: string;
  cache?: {
    maxMemoryBytes?: number;
    ttl?: number;
    staleWhileRevalidate?: boolean;
    staleIfError?: number;
    disk?: DiskCacheOptions;
    redis?: RedisCacheOptions;
  };
  compression?: CompressionOptions;
  signedUrls?: SignedUrlsOptions;
  rateLimit?: RateLimitOptions;
  server?: ServerOptions;
  logging?: {
    enabled?: boolean;
    level?: "debug" | "info" | "warn" | "error";
  };
}

export interface PurgeOptions {
  pattern?: boolean;
  tags?: string[];
}

export interface WarmOptions {
  concurrency?: number;
  headers?: Record<string, string>;
}
