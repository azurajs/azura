export type CacheEntry = {
  key: string;
  body: Buffer;
  headers: Record<string, string | string[]>;
  expiresAt: number;
  size: number;
};

export type CDNConfig = {
  origin: string;
  cache?: {
    maxMemoryBytes?: number;
    ttl?: number;
    disk?: {
      enabled?: boolean;
      path?: string;
    };
  };
  signedUrls?: {
    secret: string;
  };
  server?: {
    port?: number;
    host?: string;
  };
};
