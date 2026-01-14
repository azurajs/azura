# Release v2.3.0 - Proxy System & Router Enhancements

**Release Date:** January 11, 2026

## 🎉 What's New

### Full Proxy System

AzuraJS now includes an integrated proxy/reverse proxy system! Create API Gateways, microservices and more without external dependencies.

### Router with Prefixes

New support for modular routers that can be mounted with path prefixes, facilitating the organization of larger applications.

## ✨ Features

### 🌐 Proxy System

#### Functionalities

- **Simple Proxy**: Configure proxy in one line
- **Path Rewriting**: Rewrite paths automatically
- **Custom Headers**: Add or modify headers
- **Callbacks**: `onProxyReq`, `onProxyRes`, `onError`
- **Configurable Timeouts**: Control response time
- **Logging**: Levels `none`, `info`, `debug`

#### Basic Example

```javascript
const { AzuraClient } = require("azurajs");
const app = new AzuraClient();

app.proxy("/api", "http://localhost:4000", {
  pathRewrite: { "^/api": "" },
});

app.listen(3000);
```

#### API Gateway

```javascript
const gateway = new AzuraClient();

gateway.proxy("/users", "http://localhost:4001");
gateway.proxy("/products", "http://localhost:4002");
gateway.proxy("/orders", "http://localhost:4003");

gateway.listen(3000);
```

### 🔀 Router with Prefixes

#### Functionalities

- **Modular Routers**: Create independent routers
- **Mounting with Prefixes**: Use `app.use('/prefix', router)`
- **Organization**: Separate routes by domain/functionality
- **Reuse**: Use the same router in different contexts

#### Example

```javascript
const { AzuraClient, Router } = require("azurajs");

// Create modular routers
const aboutRouter = new Router();
aboutRouter.add("GET", "/", ({ req, res }) => {
  res.end("About Home");
});
aboutRouter.add("GET", "/team", ({ req, res }) => {
  res.end("Our Team");
});

const apiRouter = new Router();
apiRouter.add("GET", "/", ({ req, res }) => {
  res.json({ message: "API Home" });
});
apiRouter.add("GET", "/users", ({ req, res }) => {
  res.json({ users: [] });
});

// Mount with prefixes
const app = new AzuraClient();
app.use("/about", aboutRouter);
app.use("/api", apiRouter);

app.listen(3000);
```

**Resulting Routes:**

- `GET /about` → "About Home"
- `GET /about/team` → "Our Team"
- `GET /api` → JSON with message
- `GET /api/users` → JSON with users

## 📖 Documentation Improvements

### New Documentation

- **Proxy Tutorial** (EN/PT): Complete guide for using the proxy system
- **Router Prefix Tutorial** (EN/PT): How to use modular routers
- **Practical Examples**:
- `examples/servers/proxy/simple.js` - Basic proxy
- `examples/servers/proxy/microservices.js` - API Gateway
- `examples/servers/router/prefix.js` - Modular router

### Reorganized Examples

```
examples/servers/
├── basic/           # Basic examples
│   ├── server.js
│   ├── crud-api.js
│   ├── cookies.js
│   └── error-handling.js
├── middleware/      # Middlewares
│   └── basic.js
├── router/          # Advanced routing
│   └── prefix.js
├── proxy/           # Proxy system
│   ├── simple.js
│   └── microservices.js
└── advanced/        # Advanced features
    ├── bun-server.ts
    └── plugins.js

```

### Documentation Fixes

- ✅ Fixed all JavaScript examples to use `({ req, res })` (destructuring)
- ✅ Changed "Hot Reload" to "Reload" (correctly reflects `--watch`)
- ✅ Added proxy to navigation menus (EN/PT)
- ✅ Improvements in example consistency

## 🔧 Technical Improvements

### New APIs

#### ProxyOptions Interface

```typescript
interface ProxyOptions {
  target: string;
  pathRewrite?: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
  followRedirects?: boolean;
  preserveHost?: boolean;
  logLevel?: "none" | "info" | "debug";
  onProxyReq?: (proxyReq, req) => void;
  onProxyRes?: (proxyRes, req, res) => void;
  onError?: (err, req, res) => void;
}
```

#### AzuraClient Methods

```typescript
// Configure proxy
app.proxy(path: string, target: string, options?: ProxyOptions): void

// Mount router with prefix
app.use(prefix: string, router: Router): void

```

#### Router Methods

```typescript
router.add(method: string, path: string, ...handlers: Handler[]): void
router.listRoutes(): Array<{ method: string; path: string }>

```

### Internal Improvements

#### ConfigModule

- ✅ Support for `.js` configuration files
- ✅ Improvement in configuration parsing

#### Server Core

- ✅ Refactored router mounting system
- ✅ Added proxy middleware support
- ✅ Improvements in error handling for proxies

#### Router

- ✅ Public method `listRoutes()` for inspection
- ✅ Route matching optimizations

## 📦 Package Updates

### Version

- Version: `2.2.0` → `2.3.0`

### Exports

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./decorators": "./dist/decorators.js",
    "./middleware": "./dist/middleware.js",
    "./types": "./dist/types.js",
    "./plugins": "./dist/plugins.js"
  }
}
```

### Dependencies

- **Zero dependencies** maintained! 🎉
- Proxy system uses only native Node.js `http` and `https`

## 🚀 Use Cases

### 1. API Gateway

Centralize multiple microservices:

```javascript
gateway.proxy("/users", "http://users-service:4001");
gateway.proxy("/orders", "http://orders-service:4002");
```

### 2. Proxy for External APIs

```javascript
app.proxy("/github", "https://api.github.com", {
  pathRewrite: { "^/github": "" },
  headers: { "User-Agent": "MyApp" },
});
```

### 3. Modular Routers

```javascript
const adminRouter = new Router();
const publicRouter = new Router();

app.use("/admin", adminRouter);
app.use("/public", publicRouter);
```

### 4. Authentication at Gateway

```javascript
app.use("/api", authMiddleware);
app.proxy("/api", "http://backend:4000");
```

## 🐛 Bug Fixes

- ✅ Fixed JavaScript syntax in all documentation examples
- ✅ Fixed optional `debug` property in Router
- ✅ Removed duplicate `type: "module"` field from examples/package.json

## ⚠️ Breaking Changes

**None!** This release is 100% backward compatible with v2.2.0.

## 📝 Migration Notes

### From v2.2.0 to v2.3.0

No migration required! All existing features continue to work.

### New Features Available

```javascript
// Before - without native proxy
// You needed external libraries

// Now - integrated proxy
app.proxy("/api", "http://backend:4000");

// Before - non-modular routes
app.get("/admin/users", handler1);
app.get("/admin/settings", handler2);

// Now - modular routers
const adminRouter = new Router();
app.use("/admin", adminRouter);
```

## 🎯 Performance

### Proxy System

- ✅ **Zero Overhead**: Uses native Node.js streams
- ✅ **Automatic Forwarding**: Forwarding headers added automatically
- ✅ **Connection Pooling**: Reuses HTTP connections

### Router System

- ✅ **Fast Matching**: Optimized matching algorithm
- ✅ **Memory Efficient**: Tree structure for routes
- ✅ **No Regex**: Route parsing without heavy regular expressions

## 🔗 Resources

- [Documentation - Proxy (PT)](https://azura.js.org/docs/pt/proxy)
- [Documentation - Proxy (EN)](https://azura.js.org/docs/en/proxy)
- [Documentation - Routing (PT)](https://azura.js.org/docs/pt/routing#router-com-prefix)
- [Documentation - Routing (EN)](https://azura.js.org/docs/en/routing#router-with-prefix)
- [Complete Examples](https://github.com/azurajs/azura/tree/main/examples/servers)
- [GitHub Repository](https://github.com/azurajs/azura)
- [NPM Package](https://www.npmjs.com/package/azurajs)

## 🙏 Acknowledgments

Thanks to the community for all the feedback and suggestions! This release makes AzuraJS even more powerful and flexible.

## 💡 What's Next?

Planned for v2.4.0:

- WebSocket support
- Server-Sent Events (SSE)
- Built-in caching layer
- More middleware options

---

**Full Changelog**: [https://github.com/azurajs/azura/compare/v2.2.0...v2.3.0](https://github.com/azurajs/azura/compare/v2.2.0...v2.3.0)

**Install**: `npm install azurajs@2.3.0`

**Upgrade**: `npm update azurajs`
