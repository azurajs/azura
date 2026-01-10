<div align="center">
  <a href="https://azura.js.org">
    <img src="website/public/azurajs.png" width="500" height="auto" alt="azurajs"/>
  </a>
</div>

<hr />

⚡ Azura is Modern, fast, and TypeScript-first web framework for Node.js and Bun with decorator-based routing.

[![NPM Version](https://img.shields.io/npm/v/azurajs)](https://www.npmjs.com/package/azurajs)
[![License](https://img.shields.io/npm/l/azurajs)](https://github.com/0xviny/azurajs/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

## Features

✨ **Decorator-based routing** - Express-style syntax with TypeScript decorators  
🚀 **High performance** - Built for speed with minimal overhead  
📦 **Zero dependencies** - Lightweight and efficient  
🔧 **TypeScript first** - Full type safety out of the box  
🎯 **Parameter injection** - `@Body`, `@Query`, `@Param`, `@Req`, `@Res`, etc.  
🔌 **Middleware support** - Express-compatible middleware system  
⚙️ **Configurable** - File-based configuration (TS, JSON, YAML)  
🍪 **Cookie handling** - Built-in cookie parser and serializer  
🌐 **Cluster mode** - Multi-core support built-in  
📝 **Smart logging** - Environment-aware request/response logging  

## Installation

```bash
npm install azurajs
```

or with Bun:

```bash
bun add azurajs
```

## Quick Start

### 1. Create `azura.config.ts`

```typescript
import type { ConfigTypes } from "azurajs";

const config: ConfigTypes = {
  environment: "development",
  server: {
    port: 3000,
    cluster: false,
    ipHost: true,
    https: false,
  },
  logging: {
    enabled: true,
    showDetails: true,
  },
  plugins: {
    cors: {
      enabled: true,
      origins: ["*"],
    },
    rateLimit: {
      enabled: false,
      limit: 100,
      timeframe: 60000,
    },
  },
};

export default config;
```

### 2. Create your server

```typescript
import { 
  AzuraClient, 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  Res,
  applyDecorators,
  createLoggingMiddleware 
} from "azurajs";
import type { ResponseServer } from "azurajs";

@Controller("/api")
class UserController {
  @Get("/users")
  getAllUsers(@Res() res: ResponseServer) {
    res.json({ 
      users: [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" }
      ] 
    });
  }

  @Get("/users/:id")
  getUser(@Param("id") id: string, @Res() res: ResponseServer) {
    res.json({ id: Number(id), name: `User ${id}` });
  }

  @Post("/users")
  createUser(@Body() body: any, @Res() res: ResponseServer) {
    res.status(201).json({ 
      id: Date.now(), 
      ...body 
    });
  }
}

const app = new AzuraClient();
const logger = createLoggingMiddleware(app.getConfig());
app.use(logger);
applyDecorators(app, [UserController]);
await app.listen();
```

### 3. Run your server

```bash
bun run index.ts
```

## API Reference

### Decorators

#### Class Decorators

**`@Controller(prefix?: string)`**

Define a controller with optional route prefix.

```typescript
@Controller("/api/v1")
class MyController {

}
```

#### Method Decorators

**HTTP Methods:**
- `@Get(path?: string)`
- `@Post(path?: string)`
- `@Put(path?: string)`
- `@Delete(path?: string)`
- `@Patch(path?: string)`
- `@Head(path?: string)`
- `@Options(path?: string)`

```typescript
@Get("/users")
getUsers() { }

@Post("/users/:id")
updateUser() { }
```

#### Parameter Decorators

**`@Req()`** - Inject request object

```typescript
@Get("/info")
getInfo(@Req() req: RequestServer) {
  console.log(req.method, req.url);
}
```

**`@Res()`** - Inject response object

```typescript
@Get("/data")
getData(@Res() res: ResponseServer) {
  res.json({ data: "value" });
}
```

**`@Body()`** - Inject request body

```typescript
@Post("/users")
createUser(@Body() body: any) {
  console.log(body);
}
```

**`@Query(key?: string)`** - Inject query parameters

```typescript
@Get("/search")
search(@Query("q") query: string) {
  console.log(query);
}

@Get("/filter")
filter(@Query() allParams: Record<string, string>) {
  console.log(allParams);
}
```

**`@Param(key: string)`** - Inject route parameters

```typescript
@Get("/users/:id")
getUser(@Param("id") id: string) {
  console.log(id);
}
```

**`@Headers(key?: string)`** - Inject headers

```typescript
@Get("/info")
getInfo(@Headers("user-agent") ua: string) {
  console.log(ua);
}
```

**`@Ip()`** - Inject client IP address

```typescript
@Get("/visitor")
trackVisitor(@Ip() ip: string) {
  console.log(`Visitor from ${ip}`);
}
```

### Response Methods

```typescript
res.status(code: number)
res.json(data: any)
res.send(data: any)
res.redirect(url: string)
res.redirect(status: number, url: string)
res.cookie(name: string, value: string, options?: CookieOptions)
res.clearCookie(name: string, options?: CookieOptions)
res.set(field: string, value: string | number | string[])
res.get(field: string)
res.type(contentType: string)
res.location(url: string)
```

### Middleware

```typescript
import { createLoggingMiddleware } from "azurajs";

const app = new AzuraClient();

const logger = createLoggingMiddleware(app.getConfig());
app.use(logger);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

### Functional Routes

```typescript
app.get("/hello", (req, res) => {
  res.json({ message: "Hello World" });
});

app.post("/data", (req, res) => {
  res.json({ received: req.body });
});
```

## Configuration

The framework looks for configuration files in this order:
1. `azura.config.ts`
2. `azura.config.json`
3. `azura.config.yaml`
4. `azura.config.yml`

### Configuration Options

```typescript
type ConfigTypes = {
  environment?: "development" | "production";
  server?: {
    port?: number;
    cluster?: boolean;
    ipHost?: boolean;
    https?: boolean;
  };
  logging?: {
    enabled?: boolean;
    showDetails?: boolean;
  };
  plugins?: {
    cors?: {
      enabled: boolean;
      origins: string[];
    };
    rateLimit?: {
      enabled: boolean;
      limit: number;
      timeframe: number;
    };
  };
};
```

## Examples

### Complete CRUD API

```typescript
import { AzuraClient, Controller, Get, Post, Put, Delete, Body, Param, Res, applyDecorators } from "azurajs";
import type { ResponseServer } from "azurajs";

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [];

@Controller("/api/users")
class UserController {
  @Get("/")
  list(@Res() res: ResponseServer) {
    res.json(users);
  }

  @Get("/:id")
  get(@Param("id") id: string, @Res() res: ResponseServer) {
    const user = users.find(u => u.id === Number(id));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  }

  @Post("/")
  create(@Body() body: Omit<User, "id">, @Res() res: ResponseServer) {
    const user = { id: Date.now(), ...body };
    users.push(user);
    res.status(201).json(user);
  }

  @Put("/:id")
  update(@Param("id") id: string, @Body() body: Partial<User>, @Res() res: ResponseServer) {
    const index = users.findIndex(u => u.id === Number(id));
    if (index === -1) return res.status(404).json({ error: "User not found" });
    users[index] = { ...users[index], ...body };
    res.json(users[index]);
  }

  @Delete("/:id")
  delete(@Param("id") id: string, @Res() res: ResponseServer) {
    const index = users.findIndex(u => u.id === Number(id));
    if (index === -1) return res.status(404).json({ error: "User not found" });
    users.splice(index, 1);
    res.status(204).send();
  }
}

const app = new AzuraClient();
applyDecorators(app, [UserController]);
await app.listen();
```

### Authentication Example

```typescript
@Controller("/auth")
class AuthController {
  @Post("/login")
  login(@Body() body: any, @Res() res: ResponseServer) {
    const token = generateToken(body.username, body.password);
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 3600000,
      secure: true,
    });
    res.json({ success: true });
  }

  @Post("/logout")
  logout(@Res() res: ResponseServer) {
    res.clearCookie("auth_token");
    res.json({ success: true });
  }

  @Get("/profile")
  profile(@Req() req: RequestServer, @Res() res: ResponseServer) {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const user = verifyToken(token);
    res.json(user);
  }
}
```

### File Upload Example

```typescript
@Controller("/upload")
class UploadController {
  @Post("/")
  async upload(@Req() req: RequestServer, @Res() res: ResponseServer) {
    const contentType = req.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      res.json({ message: "File uploaded successfully" });
    } else {
      res.status(400).json({ error: "Invalid content type" });
    }
  }
}
```

## Production Mode

```bash
NODE_ENV=production bun run index.ts
```

Or in your config:

```typescript
const config: ConfigTypes = {
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
  logging: {
    enabled: true,
    showDetails: process.env.NODE_ENV !== "production",
  },
};
```

## Cluster Mode

Enable cluster mode for multi-core systems:

```typescript
const config: ConfigTypes = {
  server: {
    cluster: true,
  },
};
```

## Performance

AzuraJS is designed for high performance:
- Zero runtime dependencies
- Optimized routing with radix tree
- Minimal overhead middleware system
- Native Node.js http module

## TypeScript Support

Full TypeScript support with complete type definitions:

```typescript
import type { 
  RequestServer, 
  ResponseServer, 
  ConfigTypes, 
  RequestHandler 
} from "azurajs";
```

> ⚠️ Azura is TypeScript-only.

> This package ships uncompiled TypeScript source code.
> You must use a runtime or build tool that supports TypeScript:
> - Bun
> - ts-node
> - tsx
> - Deno
> - Vite

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Links

- [GitHub Repository](https://github.com/0xviny/azurajs)
- [NPM Package](https://www.npmjs.com/package/azurajs)
- [Documentation](https://azura.js.org/docs/en)
- [Examples](https://github.com/0xviny/azurajs/tree/main/examples)

## Support

- 🐛 [Issue Tracker](https://github.com/0xviny/azurajs/issues)
- 💬 [Discussions](https://github.com/0xviny/azurajs/discussions)
- 📧 Email: 0xviny.dev@gmail.com
