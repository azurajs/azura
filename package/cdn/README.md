# @azurajs/cdn

A full-featured CDN module for AzuraJS with caching, compression, signed URLs, and more.

## 📋 Table of Contents

- [Basic Concepts](#-basic-concepts)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Configuration](#-configuration)
- [API](#-api)
- [Internal Endpoints](#-internal-endpoints)
- [HTTP Headers](#-http-headers)
- [Examples](#-examples)

---

## 📖 Basic Concepts

### What is a CDN?

A CDN (Content Delivery Network) is a server that sits between clients and your origin server, caching responses to serve them faster on subsequent requests.

```
Client → CDN (cache) → Origin Server
           ↓
       Cached response (if available)
```

### How does AzuraJS CDN work?

1. **Client makes request** to CDN (e.g., `http://localhost:3001/api/users`)
2. **CDN checks cache** (memory → disk)
3. **If found (HIT)**: Returns immediately with `x-cache: HIT-MEMORY` or `HIT-DISK` header
4. **If not found (MISS)**: Fetches from origin server, stores in cache, returns with `x-cache: MISS`

### Uploading files to CDN?

The CDN **does not store files directly** - it's a **caching proxy**. You don't "upload" files to it. The CDN automatically caches responses from your origin server when clients make requests.

**Flow for serving static files:**

1. Configure your origin server to serve files (e.g., route `/files/:filename`)
2. Configure CDN to point to your origin server
3. Clients access files via CDN: `http://cdn.yoursite.com/files/document.pdf`
4. CDN automatically caches after first request

---

## 🚀 Installation

```bash
npm install @azurajs/cdn
```

---

## ⚡ Quick Start

### Standalone CDN Server

```typescript
import { createCDN } from "@azurajs/cdn";

const cdn = createCDN({
  // Origin server URL (your API)
  origin: "http://localhost:3000",

  cache: {
    maxMemoryBytes: 256 * 1024 * 1024, // 256MB RAM
    ttl: 300, // 5 minutes default
    disk: {
      enabled: true,
      path: "./cache",
      maxSizeBytes: 1024 * 1024 * 1024, // 1GB disk
    },
  },

  compression: {
    enabled: true,
    gzip: true,
    brotli: true,
  },

  signedUrls: {
    secret: "your-secret-key",
    pathPrefix: "/private/",
  },

  rateLimit: {
    enabled: true,
    windowMs: 60000, // 1 minute
    max: 1000, // 1000 req/min
  },
});

// Events
cdn.on("hit", (e) => console.log(`HIT: ${e.key} (${e.source})`));
cdn.on("miss", (e) => console.log(`MISS: ${e.key}`));

// Start
cdn.listen(3001);
```

### AzuraJS Plugin

```typescript
import { AzuraClient } from "azurajs";
import { cdnPlugin } from "@azurajs/cdn";

const app = new AzuraClient();

const cdn = app.use(
  cdnPlugin({
    origin: "http://localhost:3000",
    cache: { ttl: 300 },
  }),
);

cdn.listen(3001);
```

---

## 🔧 How It Works

### Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT REQUEST                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           RATE LIMITING                              │
│              Checks if client exceeded request limit                 │
│                    429 Too Many Requests if yes                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SIGNED URL VERIFICATION                         │
│          If path starts with /private/, validates signature          │
│                       403 Forbidden if invalid                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          L1 CACHE (MEMORY)                           │
│                 Checks if exists in RAM cache                        │
│               Header: x-cache: HIT-MEMORY if found                   │
└─────────────────────────────────────────────────────────────────────┘
                    │                              │
                 (HIT)                          (MISS)
                    │                              ▼
                    │         ┌───────────────────────────────────────┐
                    │         │           L2 CACHE (DISK)             │
                    │         │    Checks if exists in local cache    │
                    │         │     Header: x-cache: HIT-DISK         │
                    │         └───────────────────────────────────────┘
                    │                     │              │
                    │                  (HIT)          (MISS)
                    │                     │              ▼
                    │                     │  ┌────────────────────────┐
                    │                     │  │     ORIGIN SERVER      │
                    │                     │  │   Fetches real data    │
                    │                     │  │   Stores in caches     │
                    │                     │  │  Header: x-cache: MISS │
                    │                     │  └────────────────────────┘
                    ▼                     ▼              │
┌─────────────────────────────────────────────────────────────────────┐
│                       CONDITIONAL REQUEST                            │
│        Checks If-None-Match/If-Modified-Since from client            │
│                   304 Not Modified if unchanged                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          COMPRESSION                                 │
│             Checks Accept-Encoding from client                       │
│           Serves brotli > gzip > raw based on support                │
│             Header: Content-Encoding: br or gzip                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CLIENT RESPONSE                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Cache Hierarchy

| Level | Storage          | Speed | Capacity            |
| ----- | ---------------- | ----- | ------------------- |
| L1    | RAM Memory       | ~1ms  | 256MB (default)     |
| L2    | Disk SSD/HDD     | ~10ms | 1GB+ (configurable) |
| L3    | Redis (optional) | ~5ms  | Unlimited           |

---

## ⚙️ Configuration

### CDNConfig

```typescript
interface CDNConfig {
  // Origin server URL (REQUIRED)
  origin: string;

  cache?: {
    // Maximum memory cache size (bytes)
    // Default: 512MB (536870912)
    maxMemoryBytes?: number;

    // Default TTL in seconds (if origin doesn't send Cache-Control)
    // Default: 300 (5 minutes)
    ttl?: number;

    // Serve stale content while revalidating in background
    staleWhileRevalidate?: boolean;

    // Seconds to serve stale content if origin fails
    // Default: undefined (disabled)
    staleIfError?: number;

    // Disk cache configuration
    disk?: {
      enabled?: boolean;
      path?: string;
      maxSizeBytes?: number; // Default: 1GB
    };

    // Redis configuration (optional)
    redis?: {
      enabled?: boolean;
      host?: string;
      port?: number;
      password?: string;
      db?: number;
      keyPrefix?: string;
    };
  };

  compression?: {
    // Enable compression (default: true)
    enabled?: boolean;

    // Enable gzip (default: true)
    gzip?: boolean;

    // Enable brotli (default: true)
    brotli?: boolean;

    // Minimum size to compress (bytes)
    // Default: 1024 (1KB)
    minSize?: number;

    // MIME types to compress
    // Default: text/*, application/json, application/javascript, etc
    mimeTypes?: string[];
  };

  signedUrls?: {
    // Secret key for signing URLs (REQUIRED if enabled)
    secret: string;

    // Default TTL in seconds (default: 60)
    defaultTtl?: number;

    // Path prefix requiring signature (default: "/private/")
    pathPrefix?: string;
  };

  rateLimit?: {
    // Enable rate limiting
    enabled?: boolean;

    // Time window in ms (default: 60000 = 1 min)
    windowMs?: number;

    // Maximum requests per window (default: 1000)
    max?: number;

    // Custom function to generate key (default: client IP)
    keyGenerator?: (req: IncomingMessage) => string;
  };

  server?: {
    // CDN port (default: 3001)
    port?: number;

    // Host (default: "0.0.0.0")
    host?: string;
  };
}
```

---

## 📚 API

### Cache Operations

```typescript
// Exact purge
cdn.purge("/api/users/123");

// Pattern purge (wildcard)
cdn.purge("/api/users/*", { pattern: true });

// Purge by tags
cdn.purgeTags(["users", "auth"]);

// Clear all cache
cdn.purgeAll();

// Remove expired entries
await cdn.cleanup();

// Pre-populate cache (warming)
await cdn.warm(["/api/popular", "/api/featured"], { concurrency: 5 });
```

### Signed URLs

```typescript
// Generate signed URL (expires in 5 minutes)
const signedUrl = cdn.generateSignedUrl("/private/document.pdf", 300);
// Result: /private/document.pdf?expires=1706047200&sig=abc123...

// Access via CDN
// GET http://localhost:3001/private/document.pdf?expires=1706047200&sig=abc123...
```

### Events

```typescript
// Cache hit
cdn.on("hit", (event) => {
  console.log(`HIT: ${event.key}`);
  console.log(`Source: ${event.source}`); // "memory" | "disk" | "redis"
});

// Cache miss
cdn.on("miss", (event) => {
  console.log(`MISS: ${event.key}`);
});

// Purge
cdn.on("purge", (event) => {
  console.log(`PURGED: ${event.key}`);
  console.log(`Count: ${event.data?.count}`);
});

// Error
cdn.on("error", (event) => {
  console.error("CDN Error:", event.data);
});

// Compression applied
cdn.on("compress", (event) => {
  console.log(`Compressed: ${event.key}`);
});

// Cache warming
cdn.on("warm", (event) => {
  console.log(`Warmed: ${event.key}`);
});
```

### Metrics

```typescript
const metrics = cdn.getMetrics();
// {
//   requests: 12345,
//   hitRate: "94.50%",
//   hits: { memory: 10000, disk: 1650 },
//   misses: 695,
//   errors: 0,
//   bandwidth: {
//     served: "1.2 GB",    // Data sent to client
//     saved: "15.3 GB"     // Data saved (not fetched from origin)
//   },
//   avgLatency: "12.50ms",
//   uptime: "3600s"
// }

// Cache statistics
const memStats = cdn.getMemoryStats();
// { entries: 100, currentBytes: 52428800, maxBytes: 268435456, usagePercent: "19.53" }

const diskStats = await cdn.getDiskStats();
// { entries: 50, currentBytes: 104857600, maxBytes: 1073741824, usagePercent: "9.77" }

// Reset metrics
cdn.resetMetrics();
```

---

## 🔌 Internal Endpoints

When the CDN server is running (port 3001), these endpoints are available:

| Endpoint     | Method | Description                       |
| ------------ | ------ | --------------------------------- |
| `/__stats`   | GET    | Full statistics (cache + metrics) |
| `/__metrics` | GET    | Performance metrics only          |
| `/__health`  | GET    | Health check                      |
| `/__purge`   | POST   | Purge cache                       |
| `/__clear`   | POST   | Clear all cache                   |

### Usage Examples

```bash
# Health check
curl http://localhost:3001/__health

# Statistics
curl http://localhost:3001/__stats

# Exact purge
curl -X POST http://localhost:3001/__purge \
  -H "Content-Type: application/json" \
  -d '{"path": "/api/users/123"}'

# Wildcard purge
curl -X POST http://localhost:3001/__purge \
  -H "Content-Type: application/json" \
  -d '{"path": "/api/users/*", "pattern": true}'

# Purge by tags
curl -X POST http://localhost:3001/__purge \
  -H "Content-Type: application/json" \
  -d '{"tags": ["users", "posts"]}'

# Clear all
curl -X POST http://localhost:3001/__clear
```

---

## 📡 HTTP Headers

### Response Headers

| Header             | Value                           | Description                        |
| ------------------ | ------------------------------- | ---------------------------------- |
| `x-cache`          | `HIT-MEMORY`                    | Served from memory cache           |
| `x-cache`          | `HIT-DISK`                      | Served from disk cache             |
| `x-cache`          | `MISS`                          | Fetched from origin                |
| `x-cache`          | `STALE`                         | Served stale (stale-if-error)      |
| `ETag`             | `"abc123..."`                   | Content hash for validation        |
| `Last-Modified`    | `Thu, 01 Jan 2026 00:00:00 GMT` | Last modification date             |
| `Content-Encoding` | `gzip` or `br`                  | Compression applied                |
| `Vary`             | `Accept-Encoding`               | Indicates cache varies by encoding |

### Request Headers (for 304)

| Header              | Description                      |
| ------------------- | -------------------------------- |
| `If-None-Match`     | Client ETag for validation       |
| `If-Modified-Since` | Date to check modification       |
| `Accept-Encoding`   | `gzip, br` to receive compressed |

---

## 💡 Examples

### Serving Static Files

**On your origin server (port 3000):**

```typescript
import { AzuraClient } from "azurajs";
import fs from "fs";
import path from "path";

const app = new AzuraClient();

// Route to serve files
app.get("/files/:filename", (req, res) => {
  const filePath = path.join("./uploads", req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // Send with Cache-Control for CDN to respect
  res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour
  res.sendFile(filePath);
});

app.listen(3000);
```

**Accessing via CDN:**

```bash
# First request (MISS - fetches from origin)
curl http://localhost:3001/files/document.pdf
# x-cache: MISS

# Second request (HIT - from cache)
curl http://localhost:3001/files/document.pdf
# x-cache: HIT-MEMORY
```

### Private Content with Signed URL

```typescript
// On your server (port 3000)
app.get("/private/generate-link/:fileId", (req, res) => {
  const signedUrl = cdn.generateSignedUrl(
    `/private/files/${req.params.fileId}`,
    300, // 5 minutes
  );

  res.json({
    url: `http://localhost:3001${signedUrl}`,
    expiresIn: 300,
  });
});

app.get("/private/files/:fileId", (req, res) => {
  // This route only accessed if signature is valid
  const file = getFileById(req.params.fileId);
  res.sendFile(file.path);
});
```

**Usage:**

```bash
# Generate link
curl http://localhost:3000/private/generate-link/123
# { "url": "http://localhost:3001/private/files/123?expires=...&sig=...", "expiresIn": 300 }

# Access with valid link
curl "http://localhost:3001/private/files/123?expires=1706047200&sig=abc123"
# 200 OK

# Access without signature
curl http://localhost:3001/private/files/123
# 403 Forbidden
```

---

## 📊 Performance

### Typical Benchmarks

| Scenario           | Latency   | Throughput |
| ------------------ | --------- | ---------- |
| Cache HIT (memory) | ~1ms      | 50k req/s  |
| Cache HIT (disk)   | ~5-10ms   | 10k req/s  |
| Cache MISS         | ~50-200ms | 1k req/s   |
| With compression   | +2-5ms    | -20% req/s |

### Best Practices

1. **Configure appropriate TTL** - Higher TTL = more hits
2. **Use Cache-Control on origin** - `public, max-age=3600`
3. **Enable compression** - Reduces bandwidth by 60-80%
4. **Use ETag** - Saves bandwidth with 304
5. **Monitor metrics** - Goal: hit rate > 90%

---

## 🛠️ Troubleshooting

### CDN is not caching

1. Check if origin returns 2xx status
2. Check if origin returns `Cache-Control: private` or `no-store`
3. Check if TTL is not too low

### 403 on private URLs

1. Check if signature is correct
2. Check if not expired
3. Check if secret is the same

### Rate limit reached

```bash
# Response
# 429 Too Many Requests
# { "error": "Rate limit exceeded" }
```

Increase `max` or `windowMs` in configuration.

---

## 📄 License

MIT
