export { createServer } from "./server.js";

export { cdnPlugin } from "./plugin.js";

export { cacheMiddleware } from "./middleware.js";

export { MemoryCache } from "./cache/memory.js";
export { DiskCache } from "./cache/disk.js";

export { CDNEventEmitter } from "./events.js";
export { MetricsCollector } from "./metrics.js";

export {
  CompressionHandler,
  createCompressionHandler,
} from "./http/compression.js";
export {
  generateETag,
  generateWeakETag,
  etagMatches,
  shouldReturn304,
  create304Headers,
  formatHttpDate,
} from "./http/conditional.js";
export { generateSignedUrl, verifySignedQuery } from "./http/signer.js";
export { streamFromOrigin } from "./http/origin.js";
export { parseCacheControl } from "./http/header.js";

export { collectStream } from "./utils/collector.js";
export {
  globToRegex,
  matchesPattern,
  filterByPattern,
  matchesRoutePattern,
  normalizeCacheKey,
} from "./utils/pattern.js";

export type {
  CacheEntry,
  CacheStats,
  CDNConfig,
  CDNMetrics,
  CDNEvent,
  CDNEventType,
  CDNEventHandler,
  ICacheBackend,
  CompressionOptions,
  RateLimitOptions,
  SignedUrlsOptions,
  DiskCacheOptions,
  RedisCacheOptions,
  ServerOptions,
  PurgeOptions,
  WarmOptions,
} from "./types/common.js";

import { createServer } from "./server.js";
import type { CDNConfig } from "./types/common.js";

export function createCDN(config: CDNConfig) {
  return createServer(config);
}

export default createCDN;
