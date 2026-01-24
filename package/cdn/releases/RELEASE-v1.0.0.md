# Release v1.0.0 - Production-Ready CDN, Smart Caching & Security

**Release Date:** January 23, 2026

## 🎉 What's New

### 📦 Smart Caching Architecture

The caching engine has been completely re-architected to support a multi-tier strategy. We introduced a hybrid system using high-performance **LRU Memory Cache** for frequently accessed items and **Disk Storage** for larger assets. The new `ICacheBackend` interface ensures future extensibility for distributed stores like Redis.

### 🧹 Advanced Purging capabilities

Cache invalidation just got powerful. You can now purge content with precision:

- **Wildcard Patterns**: Invalidate entire sections of your API using patterns like `/api/users/*`.
- **Tag-based Purging**: Group resources by semantic tags (e.g., `product:123`, `category:electronics`) and purge them all in a single call.
- **Cache Warming**: Pre-populate critical assets before traffic spikes using the new `warm` endpoint.

### 📊 Full Observability

Understanding your CDN's performance is crucial. We've added a robust event system and metrics collection:

- **Events**: Subscribe to `hit`, `miss`, `purge`, and `error` events to trigger custom logging or webhooks.
- **Metrics**: Track real-time hit rates, latency, bandwidth savings, and error rates via the `MetricsCollector`.

## ✨ Improvements

### ⚡ Performance & Efficiency

#### Automatic Compression

The CDN now intelligently negotiates content encoding. It automatically compresses responses using **Brotli** or **Gzip** based on the client's `Accept-Encoding` header and configurable thresholds, significantly reducing bandwidth usage.

#### Conditional Requests (304)

We now fully support `ETag` and `Last-Modified` headers. If the content hasn't changed, the CDN serves a `304 Not Modified` response instantly, saving bandwidth and processing time for both the client and the server.

### 🛡️ Security First

#### Signed URLs

Protect your private assets with time-limited access. The new `generateSignedUrl` utility creates tamper-proof URLs with HMAC signatures, perfect for serving exclusive content.

#### Rate Limiting

Built-in protection against abuse. Configure global or per-IP rate limits to Shield your origin server from traffic spikes and DoS attacks.

## � Technical Details

### Enhanced Configuration

The configuration object has been expanded to give you granular control over every aspect of the CDN.

**Before:**

```typescript
const config = {
  origin: "http://localhost:3000",
};
```

**Now:**

```typescript
const config: CDNConfig = {
  origin: "http://localhost:3000",
  cache: {
    ttl: 300,
    maxMemoryBytes: 100 * 1024 * 1024,
    disk: { enabled: true, path: "./cache" },
  },
  compression: { enabled: true },
  signedUrls: { secret: "your-secret-key" },
  staleIfError: 600, // Serve stale content for 10m if origin fails
};
```

### Stale-While-Revalidate

To ensure high availability, the CDN can now serve stale content if the origin server becomes unreachable or returns 5xx errors, ensuring your users rarely see an error page.

## 🚀 Migration Guide

### Breaking Changes?

**Yes.** This is a major release that transforms the package structure.

1. **Exports**: We now export specific modules (`server`, `plugin`, `middleware`). If you were importing internal files directly, check the new exports.
2. **Configuration**: The `createCDN` function now accepts a typed `CDNConfig` object which has stricter validation.

### Recommended Updates

Update your `@azurajs/cdn` package to unlock these features:

```bash
npm install @azurajs/cdn@latest
```

## 🔗 Links

- 📚 [Full Documentation](https://azurajs.com/docs)
- 🐛 [Report Issues](https://github.com/azurajs/cdn/issues)
- 📦 [npm Package](https://www.npmjs.com/package/@azurajs/cdn)

---

**Happy Caching with AzuraJS CDN v1.0.0! 🚀**
