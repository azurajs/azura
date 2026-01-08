# API Reference

Complete API documentation for AzuraJS.

## Table of Contents

- [Core Classes](#core-classes)
- [Decorators](#decorators)
- [Types](#types)
- [Request Object](#request-object)
- [Response Object](#response-object)
- [Middleware](#middleware)
- [Configuration](#configuration)
- [Utilities](#utilities)

## Core Classes

### AzuraClient

The main server class that handles routing, middleware, and HTTP server management.

```typescript
import { AzuraClient } from "azurajs";

const app = new AzuraClient();
```

#### Methods

##### `listen(port?: number): Promise<void>`

Starts the HTTP server.

```typescript
await app.listen(3000);
```

##### `use(middleware: RequestHandler): void`

Adds global middleware to the application.

```typescript
app.use(async ({ req, res, next }) => {
  console.log(`${req.method} ${req.path}`);
  await next();
});
```

##### `get(path: string, ...handlers: RequestHandler[]): void`

Registers a GET route.

```typescript
app.get("/users", (ctx) => {
  ctx.res.json({ users: [] });
});
```

##### `post(path: string, ...handlers: RequestHandler[]): void`

Registers a POST route.

```typescript
app.post("/users", (ctx) => {
  const user = ctx.req.body;
  ctx.res.status(201).json(user);
});
```

##### `put(path: string, ...handlers: RequestHandler[]): void`

Registers a PUT route.

##### `delete(path: string, ...handlers: RequestHandler[]): void`

Registers a DELETE route.

##### `patch(path: string, ...handlers: RequestHandler[]): void`

Registers a PATCH route.

##### `getConfig(): ConfigTypes`

Returns the current configuration.

```typescript
const config = app.getConfig();
console.log(config.server.port);
```

---

## Decorators

### Class Decorators

#### `@Controller(basePath?: string)`

Defines a controller class with an optional base path for all routes.

```typescript
@Controller("/api/users")
export class UserController {
  // All routes will be prefixed with /api/users
}
```

### Method Decorators

#### `@Get(path: string)`

Defines a GET route.

```typescript
@Get("/")
getAllUsers(@Res() res: ResponseServer) {
  res.json({ users: [] });
}
```

#### `@Post(path: string)`

Defines a POST route.

```typescript
@Post("/")
createUser(@Body() body: any, @Res() res: ResponseServer) {
  res.status(201).json(body);
}
```

#### `@Put(path: string)`

Defines a PUT route.

#### `@Delete(path: string)`

Defines a DELETE route.

#### `@Patch(path: string)`

Defines a PATCH route.

### Parameter Decorators

#### `@Req()`

Injects the request object.

```typescript
@Get("/")
handler(@Req() req: RequestServer) {
  console.log(req.method, req.path);
}
```

#### `@Res()`

Injects the response object.

```typescript
@Get("/")
handler(@Res() res: ResponseServer) {
  res.json({ success: true });
}
```

#### `@Body(key?: string)`

Injects the request body or a specific property.

```typescript
// Entire body
@Post("/")
create(@Body() body: any) {}

// Specific property
@Post("/")
create(@Body("email") email: string) {}
```

#### `@Query(key?: string)`

Injects query parameters or a specific query parameter.

```typescript
// All query params
@Get("/search")
search(@Query() query: Record<string, string>) {}

// Specific param
@Get("/search")
search(@Query("q") searchTerm: string) {}
```

#### `@Param(key?: string)`

Injects URL parameters or a specific parameter.

```typescript
// All params
@Get("/:id/:action")
handler(@Param() params: Record<string, string>) {}

// Specific param
@Get("/:id")
handler(@Param("id") id: string) {}
```

---

## Types

### RequestServer

Extended Node.js IncomingMessage with additional properties.

```typescript
interface RequestServer extends http.IncomingMessage {
  // Original properties
  method?: string;
  url?: string;
  headers: http.IncomingHttpHeaders;
  
  // Extended properties
  body: any;
  query: Record<string, string>;
  params: Record<string, string>;
  cookies: Record<string, string>;
  path: string;
  originalUrl: string;
  protocol: string;
  secure: boolean;
  hostname: string;
  subdomains: string[];
  ip: string;
  ips: string[];
  
  // Methods
  get(name: string): string | undefined;
  header(name: string): string | undefined;
}
```

### ResponseServer

Extended Node.js ServerResponse with chainable methods.

```typescript
interface ResponseServer extends http.ServerResponse {
  // Status
  status(code: number): ResponseServer;
  
  // Headers
  set(field: string, value: string | number | string[]): ResponseServer;
  header(field: string, value: string | number | string[]): ResponseServer;
  get(field: string): string | undefined;
  type(contentType: string): ResponseServer;
  contentType(contentType: string): ResponseServer;
  
  // Response
  send(body?: any): ResponseServer;
  json(body: any): ResponseServer;
  
  // Redirect
  redirect(url: string): ResponseServer;
  redirect(status: number, url: string): ResponseServer;
  location(url: string): ResponseServer;
  
  // Cookies
  cookie(name: string, value: string, options?: CookieOptions): ResponseServer;
  clearCookie(name: string, options?: CookieOptions): ResponseServer;
}
```

### CookieOptions

```typescript
interface CookieOptions {
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}
```

### ConfigTypes

```typescript
interface ConfigTypes {
  environment: "development" | "production";
  server: {
    port: number;
    cluster?: boolean;
    ipHost?: boolean;
    https?: boolean;
  };
  logging?: {
    enabled: boolean;
    showDetails?: boolean;
  };
  plugins?: {
    cors?: {
      enabled: boolean;
      origins?: string[];
      methods?: string[];
      allowedHeaders?: string[];
    };
    rateLimit?: {
      enabled: boolean;
      limit: number;
      timeframe: number;
    };
  };
}
```

---

## Request Object

### Properties

#### `req.body: any`

Parsed request body (JSON or URL-encoded).

```typescript
@Post("/users")
create(@Body() body: any) {
  console.log(body); // { name: "John", email: "john@example.com" }
}
```

#### `req.query: Record<string, string>`

Parsed query string parameters.

```typescript
// GET /search?q=hello&page=1
@Get("/search")
search(@Query() query: Record<string, string>) {
  console.log(query); // { q: "hello", page: "1" }
}
```

#### `req.params: Record<string, string>`

URL route parameters.

```typescript
// GET /users/123
@Get("/users/:id")
getUser(@Param("id") id: string) {
  console.log(id); // "123"
}
```

#### `req.cookies: Record<string, string>`

Parsed cookies from Cookie header.

```typescript
@Get("/")
handler(@Req() req: RequestServer) {
  console.log(req.cookies.session); // "abc123"
}
```

#### `req.path: string`

Request URL path without query string.

#### `req.originalUrl: string`

Original request URL including query string.

#### `req.protocol: string`

Protocol: "http" or "https".

#### `req.secure: boolean`

`true` if protocol is HTTPS.

#### `req.hostname: string`

Host name from Host header.

#### `req.ip: string`

Client IP address.

#### `req.ips: string[]`

Array of IPs from X-Forwarded-For header.

### Methods

#### `req.get(name: string): string | undefined`

Get request header value.

```typescript
const contentType = req.get("content-type");
const auth = req.header("authorization"); // alias
```

---

## Response Object

### Status

#### `res.status(code: number): ResponseServer`

Set HTTP status code.

```typescript
res.status(404).json({ error: "Not found" });
res.status(201).send("Created");
```

### Headers

#### `res.set(field: string, value: string | number | string[]): ResponseServer`

Set response header.

```typescript
res.set("X-Custom-Header", "value");
res.header("Cache-Control", "no-cache"); // alias
```

#### `res.get(field: string): string | undefined`

Get response header value.

#### `res.type(contentType: string): ResponseServer`

Set Content-Type header.

```typescript
res.type("application/xml");
res.contentType("text/html"); // alias
```

### Sending Responses

#### `res.send(body?: any): ResponseServer`

Send response. Automatically sets Content-Type for objects.

```typescript
res.send("Hello");
res.send({ message: "Hello" }); // Auto-sets to application/json
res.send(); // Empty response
```

#### `res.json(body: any): ResponseServer`

Send JSON response.

```typescript
res.json({ users: [], total: 0 });
```

### Redirects

#### `res.redirect(url: string): ResponseServer`
#### `res.redirect(status: number, url: string): ResponseServer`

Redirect to URL.

```typescript
res.redirect("/login"); // 302 by default
res.redirect(301, "/new-page"); // Permanent redirect
```

#### `res.location(url: string): ResponseServer`

Set Location header without redirecting.

### Cookies

#### `res.cookie(name: string, value: string, options?: CookieOptions): ResponseServer`

Set a cookie.

```typescript
res.cookie("session", "abc123", {
  httpOnly: true,
  secure: true,
  maxAge: 3600000, // 1 hour
  sameSite: "Strict"
});
```

#### `res.clearCookie(name: string, options?: CookieOptions): ResponseServer`

Clear a cookie.

```typescript
res.clearCookie("session");
```

---

## Middleware

### Creating Middleware

```typescript
import type { RequestHandler } from "azurajs";

const myMiddleware: RequestHandler = async ({ req, res, next }) => {
  // Do something before the route handler
  console.log(`${req.method} ${req.path}`);
  
  // Call next to continue to the next handler
  await next();
  
  // Do something after the route handler
  console.log("Response sent");
};
```

### Global Middleware

Apply to all routes:

```typescript
app.use(myMiddleware);
```

### Route-Specific Middleware

Apply to specific routes:

```typescript
app.get("/protected", authMiddleware, (ctx) => {
  ctx.res.json({ data: "secret" });
});
```

### Built-in Middleware

#### Logging Middleware

```typescript
import { createLoggingMiddleware } from "azurajs";

const logger = createLoggingMiddleware({
  showDetails: true
});

app.use(logger);
```

### Error Handling in Middleware

```typescript
const errorHandler: RequestHandler = async ({ req, res, next }) => {
  try {
    await next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
```

---

## Configuration

Configuration is loaded from `azura.config.{ts,js,json,yaml}` in the project root.

### Example Configuration

```typescript
import type { ConfigTypes } from "azurajs";

const config: ConfigTypes = {
  environment: "development",
  
  server: {
    port: 3000,
    cluster: false,    // Enable multi-core clustering
    ipHost: true,      // Show network IP on startup
    https: false,      // HTTPS mode
  },
  
  logging: {
    enabled: true,
    showDetails: true, // Show request/response details
  },
  
  plugins: {
    cors: {
      enabled: true,
      origins: ["http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    rateLimit: {
      enabled: true,
      limit: 100,        // Max 100 requests
      timeframe: 60000,  // Per 60 seconds
    },
  },
};

export default config;
```

---

## Utilities

### HttpError

Custom error class for HTTP errors.

```typescript
import { HttpError } from "azurajs";

throw new HttpError(404, "User not found");
throw new HttpError(400, "Invalid input", { field: "email" });
```

### applyDecorators

Apply controller decorators to the app.

```typescript
import { applyDecorators } from "azurajs";
import { UserController } from "./controllers/UserController";

applyDecorators(app, [UserController]);
```

---

## Examples

### Complete CRUD Example

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Res } from "azurajs";
import type { ResponseServer } from "azurajs";

interface User {
  id: number;
  name: string;
  email: string;
}

@Controller("/api/users")
export class UserController {
  private users: User[] = [];
  private nextId = 1;

  @Get("/")
  getAll(@Res() res: ResponseServer) {
    res.json(this.users);
  }

  @Get("/:id")
  getOne(@Param("id") id: string, @Res() res: ResponseServer) {
    const user = this.users.find(u => u.id === parseInt(id));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  }

  @Post("/")
  create(@Body() body: Omit<User, "id">, @Res() res: ResponseServer) {
    const user: User = { id: this.nextId++, ...body };
    this.users.push(user);
    res.status(201).json(user);
  }

  @Put("/:id")
  update(
    @Param("id") id: string,
    @Body() body: Partial<User>,
    @Res() res: ResponseServer
  ) {
    const index = this.users.findIndex(u => u.id === parseInt(id));
    if (index === -1) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    this.users[index] = { ...this.users[index], ...body };
    res.json(this.users[index]);
  }

  @Delete("/:id")
  remove(@Param("id") id: string, @Res() res: ResponseServer) {
    const index = this.users.findIndex(u => u.id === parseInt(id));
    if (index === -1) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    this.users.splice(index, 1);
    res.status(204).send();
  }
}
```

---

For more examples, check the [examples directory](../examples/) in the repository.
