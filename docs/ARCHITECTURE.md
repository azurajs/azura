# Architecture Overview

This document provides a detailed overview of AzuraJS's internal architecture and design decisions.

## Table of Contents

- [Core Principles](#core-principles)
- [Project Structure](#project-structure)
- [Request Lifecycle](#request-lifecycle)
- [Routing System](#routing-system)
- [Decorator System](#decorator-system)
- [Middleware Pipeline](#middleware-pipeline)
- [Configuration System](#configuration-system)
- [Performance Considerations](#performance-considerations)

## Core Principles

AzuraJS is built on the following principles:

1. **Zero Dependencies** - Pure Node.js/Bun implementation
2. **TypeScript First** - Full type safety throughout
3. **Developer Experience** - Clean, intuitive API
4. **Performance** - Minimal overhead, maximum speed
5. **Flexibility** - Easy to extend and customize

## Project Structure

```
package/src/
├── index.ts                    # Public API exports
├── decorators/                 # Decorator implementations
│   ├── index.ts
│   └── Route.ts               # @Get, @Post, @Controller, etc.
├── infra/                      # Core infrastructure
│   ├── Router.ts              # Radix tree router
│   ├── Server.ts              # HTTP server & request handling
│   └── utils/
│       ├── GetIp.ts           # Network IP detection
│       ├── GetOpenPort.ts     # Port availability check
│       ├── HttpError.ts       # HTTP error class
│       ├── RequestHandler.ts  # Handler adapter
│       └── route/
│           └── Node.ts        # Router tree node
├── middleware/                 # Built-in middleware
│   ├── index.ts
│   └── LoggingMiddleware.ts   # Request/response logger
├── shared/                     # Shared modules
│   ├── config/
│   │   └── ConfigModule.ts    # Config loading & parsing
│   └── plugins/
│       ├── CORSPlugin.ts      # CORS handling
│       └── RateLimitPlugin.ts # Rate limiting
├── types/                      # TypeScript definitions
│   ├── common.type.ts         # Common types
│   ├── routes.type.ts         # Route types
│   ├── validations.type.ts    # Validation types
│   ├── http/
│   │   ├── request.type.ts    # Request extensions
│   │   └── response.type.ts   # Response extensions
│   └── plugins/
│       └── cors.type.ts       # CORS types
└── utils/                      # Utilities
    ├── Logger.ts              # Logging utility
    ├── Parser.ts              # Query string parser
    ├── cookies/
    │   ├── ParserCookie.ts    # Cookie parser
    │   └── SerializeCookie.ts # Cookie serializer
    └── validators/
        ├── DTOValidator.ts    # DTO validation
        └── SchemaValidator.ts # Schema validation
```

## Request Lifecycle

### 1. Server Initialization

```typescript
constructor() {
  // Load configuration
  const config = new ConfigModule();
  config.initSync();
  this.opts = config.getAll();
  
  // Initialize server
  this.initPromise = this.init();
}
```

### 2. Server Setup (init)

```typescript
private async init() {
  // Set port
  this.port = this.opts.server?.port || 3000;
  
  // Setup clustering (if enabled)
  if (this.opts.server?.cluster && cluster.isPrimary) {
    // Fork workers
  }
  
  // Initialize plugins
  if (this.opts.plugins?.cors?.enabled) {
    cors(/* options */);
  }
  
  if (this.opts.plugins?.rateLimit?.enabled) {
    rateLimit(/* options */);
  }
  
  // Create HTTP server
  this.server = http.createServer();
  this.server.on("request", this.handle.bind(this));
}
```

### 3. Request Handling

```typescript
private async handle(rawReq: RequestServer, rawRes: ResponseServer) {
  // 1. Extend request object
  rawReq.originalUrl = rawReq.url || "";
  rawReq.protocol = this.opts.server?.https ? "https" : "http";
  rawReq.hostname = /* parse from headers */;
  rawReq.get = (name) => /* get header */;
  
  // 2. Extend response object
  rawRes.status = (code) => /* set status */;
  rawRes.json = (body) => /* send JSON */;
  rawRes.cookie = (name, val, opts) => /* set cookie */;
  // ... more methods
  
  // 3. Parse URL and query string
  const [urlPath, qs] = (rawReq.url || "").split("?");
  rawReq.path = urlPath || "/";
  rawReq.query = parseQS(qs || "");
  
  // 4. Parse cookies
  rawReq.cookies = parseCookiesHeader(rawReq.headers["cookie"]);
  
  // 5. Parse body (for POST/PUT/PATCH)
  if (["POST", "PUT", "PATCH"].includes(rawReq.method)) {
    await new Promise<void>((resolve) => {
      // Read body chunks
      // Parse JSON or form data
    });
  }
  
  // 6. Route matching
  const { handlers, params } = this.router.find(
    rawReq.method || "GET",
    rawReq.path
  );
  rawReq.params = params || {};
  
  // 7. Execute middleware + handler chain
  const chain = [
    ...this.middlewares.map(adaptRequestHandler),
    ...handlers.map(adaptRequestHandler),
  ];
  
  let idx = 0;
  const next = async (err?: any) => {
    if (err) return errorHandler(err);
    if (idx >= chain.length) return;
    const fn = chain[idx++];
    await fn({ request: rawReq, response: rawRes, req: rawReq, res: rawRes, next });
  };
  
  await next();
}
```

## Routing System

AzuraJS uses a **Radix Tree** (prefix tree) for efficient route matching.

### Router Implementation

```typescript
export class Router {
  private trees: Map<string, Node> = new Map();
  
  add(method: string, path: string, ...handlers: Handler[]) {
    // Get or create tree for HTTP method
    if (!this.trees.has(method)) {
      this.trees.set(method, new Node());
    }
    const root = this.trees.get(method)!;
    
    // Insert path into tree
    root.insert(path, handlers);
  }
  
  find(method: string, path: string) {
    const root = this.trees.get(method);
    if (!root) return { handlers: [], params: {} };
    
    // Traverse tree to find matching route
    return root.search(path);
  }
}
```

### Node Structure

Each node in the radix tree represents a path segment:

```typescript
class Node {
  segment: string = "";
  handlers: Handler[] = [];
  children: Map<string, Node> = new Map();
  paramChild?: Node;
  wildcardChild?: Node;
  
  insert(path: string, handlers: Handler[]) {
    // Split path into segments
    // Create/traverse nodes
    // Handle :param and * wildcards
  }
  
  search(path: string): { handlers: Handler[], params: Record<string, string> } {
    // Match exact segments
    // Match :param segments
    // Match * wildcard
    // Extract parameter values
  }
}
```

### Route Matching Order

1. **Static segments** (highest priority)
2. **Named parameters** (:param)
3. **Wildcards** (*) (lowest priority)

Example:

```typescript
app.get("/users/admin", handler1);      // Static - highest priority
app.get("/users/:id", handler2);        // Parameter
app.get("/users/*", handler3);          // Wildcard - lowest priority

// GET /users/admin    -> handler1
// GET /users/123      -> handler2
// GET /users/foo/bar  -> handler3
```

## Decorator System

### Metadata Storage

Decorators store route information in a metadata map:

```typescript
const routesMetadata = new Map<any, RouteMetadata[]>();

interface RouteMetadata {
  method: string;
  path: string;
  propertyKey: string;
  descriptor: PropertyDescriptor;
  paramMetadata: ParamMetadata[];
}
```

### Controller Decorator

```typescript
export function Controller(basePath: string = ""): ClassDecorator {
  return (target: any) => {
    // Store base path on the class
    Reflect.defineMetadata("basePath", basePath, target);
  };
}
```

### Route Method Decorators

```typescript
function createRouteDecorator(method: string) {
  return (path: string): MethodDecorator => {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      // Get existing metadata or create new
      const routes = routesMetadata.get(target.constructor) || [];
      
      // Add route metadata
      routes.push({
        method,
        path,
        propertyKey: String(propertyKey),
        descriptor,
        paramMetadata: getParamMetadata(target, propertyKey),
      });
      
      routesMetadata.set(target.constructor, routes);
    };
  };
}

export const Get = createRouteDecorator("GET");
export const Post = createRouteDecorator("POST");
// ... etc
```

### Parameter Decorators

```typescript
export function Body(key?: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    // Store parameter metadata
    const params = getParamMetadata(target, propertyKey) || [];
    params[parameterIndex] = { type: "body", key };
    setParamMetadata(target, propertyKey, params);
  };
}
```

### Applying Decorators

```typescript
export function applyDecorators(app: AzuraClient, controllers: any[]) {
  for (const ControllerClass of controllers) {
    const basePath = Reflect.getMetadata("basePath", ControllerClass) || "";
    const routes = routesMetadata.get(ControllerClass) || [];
    
    const instance = new ControllerClass();
    
    for (const route of routes) {
      const fullPath = basePath + route.path;
      const handler = createHandler(instance, route);
      app.addRoute(route.method, fullPath, handler);
    }
  }
}
```

## Middleware Pipeline

### Request Handler Context

```typescript
interface HandlerContext {
  request: RequestServer;
  response: ResponseServer;
  req: RequestServer;    // Alias
  res: ResponseServer;   // Alias
  next: (err?: any) => Promise<void>;
}
```

### Handler Adaptation

The `adaptRequestHandler` function converts various handler formats to a unified format:

```typescript
function adaptRequestHandler(handler: RequestHandler): Handler {
  return async (ctx: HandlerContext) => {
    await handler(ctx);
  };
}
```

### Execution Chain

```typescript
const chain = [
  ...globalMiddlewares,    // Applied with app.use()
  ...routeHandlers,        // Route-specific handlers
];

let idx = 0;
const next = async (err?: any) => {
  if (err) return errorHandler(err);
  if (idx >= chain.length) return;
  
  const fn = chain[idx++];
  await fn({ req, res, next });
};

await next(); // Start the chain
```

## Configuration System

### Configuration Loading

```typescript
export class ConfigModule {
  private config: ConfigTypes | null = null;
  
  initSync() {
    // Try loading from different file formats
    const formats = [".ts", ".js", ".json", ".yaml"];
    
    for (const ext of formats) {
      const configPath = path.join(process.cwd(), `azura.config${ext}`);
      if (fs.existsSync(configPath)) {
        this.config = this.loadConfig(configPath);
        break;
      }
    }
    
    if (!this.config) {
      throw new Error("Configuration file not found");
    }
  }
  
  getAll(): ConfigTypes {
    return this.config!;
  }
}
```

### Configuration Validation

Type safety is enforced through TypeScript:

```typescript
export interface ConfigTypes {
  environment: "development" | "production";
  server: {
    port: number;
    cluster?: boolean;
    ipHost?: boolean;
    https?: boolean;
  };
  // ... more options
}
```

## Performance Considerations

### 1. Zero Dependencies

No external dependencies means:
- Smaller bundle size
- Faster installation
- No dependency conflicts
- Full control over implementation

### 2. Radix Tree Routing

- O(k) lookup time where k = path length
- Much faster than linear regex matching
- Efficient memory usage

### 3. Clustering Support

```typescript
if (config.server.cluster && cluster.isPrimary) {
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
}
```

Automatically utilizes all CPU cores for maximum throughput.

### 4. Minimal Object Creation

- Request/response objects are extended in-place
- No unnecessary copying
- Reuse of Node.js native objects

### 5. Async/Await Throughout

- Non-blocking I/O
- Efficient resource utilization
- Modern async patterns

## Design Patterns

### 1. Decorator Pattern

Used for routing and parameter injection.

### 2. Chain of Responsibility

Middleware pipeline follows this pattern.

### 3. Builder Pattern

Response object with method chaining:

```typescript
res.status(200).type("json").cookie("session", "abc").json({ ok: true });
```

### 4. Factory Pattern

Route handler creation and adaptation.

### 5. Singleton Pattern

Server instance and configuration module.

## Extension Points

### Custom Middleware

```typescript
app.use(async ({ req, res, next }) => {
  // Your logic
  await next();
});
```

### Custom Plugins

```typescript
// In azura.config.ts
plugins: {
  myPlugin: {
    enabled: true,
    options: { /* ... */ }
  }
}
```

### Custom Decorators

```typescript
export function CustomDecorator(): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    // Your logic
  };
}
```

## Future Improvements

Potential areas for enhancement:

1. **WebSocket Support** - Real-time communication
2. **GraphQL Integration** - Built-in GraphQL support
3. **File Uploads** - Multipart form data handling
4. **Template Engines** - View rendering support
5. **Authentication** - Built-in auth strategies
6. **Database ORM** - Optional ORM integration
7. **Testing Utilities** - Built-in test helpers
8. **OpenAPI/Swagger** - Auto-generated API docs

---

For implementation details, see the source code in the `package/src` directory.
