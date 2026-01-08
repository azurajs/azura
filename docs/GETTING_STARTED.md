# Getting Started with AzuraJS

Welcome to AzuraJS! This guide will help you get started with building your first web application using AzuraJS.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Your First Application](#your-first-application)
- [Understanding the Basics](#understanding-the-basics)
- [Configuration](#configuration)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, make sure you have one of the following installed:

- **Node.js** 18.x or higher
- **Bun** 1.0 or higher (recommended for better performance)

Check your version:

```bash
node --version
# or
bun --version
```

## Installation

Create a new project directory and initialize it:

```bash
mkdir my-azura-app
cd my-azura-app
npm init -y
# or
bun init -y
```

Install AzuraJS:

```bash
npm install azurajs
# or
bun add azurajs
```

Install TypeScript and required dependencies:

```bash
npm install -D typescript @types/node
# or
bun add -d typescript @types/node
```

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Your First Application

### Step 1: Create Configuration File

Create `azura.config.ts` in your project root:

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
  },
};

export default config;
```

### Step 2: Create Your First Controller

Create `src/controllers/HelloController.ts`:

```typescript
import { Controller, Get, Res } from "azurajs";
import type { ResponseServer } from "azurajs";

@Controller("/api")
export class HelloController {
  @Get("/hello")
  sayHello(@Res() res: ResponseServer) {
    res.json({ message: "Hello, AzuraJS!" });
  }

  @Get("/hello/:name")
  sayHelloToName(@Param("name") name: string, @Res() res: ResponseServer) {
    res.json({ message: `Hello, ${name}!` });
  }
}
```

### Step 3: Create the Main Server File

Create `src/index.ts`:

```typescript
import { AzuraClient, applyDecorators } from "azurajs";
import { HelloController } from "./controllers/HelloController";

const app = new AzuraClient();

// Apply decorators from your controllers
applyDecorators(app, [HelloController]);

// Start the server
app.listen();
```

### Step 4: Add Start Script

Update your `package.json`:

```json
{
  "scripts": {
    "dev": "bun run src/index.ts",
    "start": "node --experimental-specifier-resolution=node src/index.ts"
  }
}
```

### Step 5: Run Your Application

```bash
bun run dev
# or
npm run dev
```

You should see:

```
[info] [master] listening on http://localhost:3000
```

### Step 6: Test Your API

Open your browser or use curl:

```bash
curl http://localhost:3000/api/hello
# Response: {"message":"Hello, AzuraJS!"}

curl http://localhost:3000/api/hello/World
# Response: {"message":"Hello, World!"}
```

## Understanding the Basics

### Controllers

Controllers are classes decorated with `@Controller()` that group related routes together:

```typescript
@Controller("/api/users")
export class UserController {
  // Routes will be prefixed with /api/users
}
```

### Route Decorators

Use HTTP method decorators to define routes:

```typescript
@Get("/")         // GET /api/users
@Post("/")        // POST /api/users
@Put("/:id")      // PUT /api/users/:id
@Delete("/:id")   // DELETE /api/users/:id
@Patch("/:id")    // PATCH /api/users/:id
```

### Parameter Decorators

Extract data from requests using parameter decorators:

```typescript
@Post("/users")
createUser(
  @Body() body: any,                    // Request body
  @Query("active") active: string,      // Query parameter
  @Param("id") id: string,              // URL parameter
  @Req() req: RequestServer,            // Full request object
  @Res() res: ResponseServer            // Full response object
) {
  res.json({ id, body, active });
}
```

### Working with Request Body

```typescript
@Post("/users")
createUser(@Body() userData: UserDTO, @Res() res: ResponseServer) {
  // userData contains the parsed JSON body
  const user = {
    id: Date.now(),
    ...userData
  };
  res.status(201).json(user);
}
```

### Working with Query Parameters

```typescript
@Get("/search")
search(
  @Query("q") query: string,
  @Query("page") page: string,
  @Res() res: ResponseServer
) {
  const results = searchDatabase(query, parseInt(page) || 1);
  res.json(results);
}
```

### Working with URL Parameters

```typescript
@Get("/users/:id")
getUser(@Param("id") id: string, @Res() res: ResponseServer) {
  const user = findUserById(id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
}
```

### Response Methods

```typescript
// Send JSON
res.json({ key: "value" });

// Send plain text
res.send("Hello World");

// Set status code
res.status(201).json({ created: true });

// Redirect
res.redirect("/new-location");
res.redirect(301, "/permanent-redirect");

// Set headers
res.set("X-Custom-Header", "value");
res.type("application/xml");

// Cookies
res.cookie("session", "abc123", { httpOnly: true, maxAge: 3600000 });
res.clearCookie("session");
```

## Configuration

### Environment-based Configuration

You can create different config files:

```typescript
// azura.config.development.ts
export default {
  environment: "development",
  server: { port: 3000 },
  logging: { enabled: true, showDetails: true }
};

// azura.config.production.ts
export default {
  environment: "production",
  server: { port: 8080, cluster: true },
  logging: { enabled: false }
};
```

### Configuration Options

```typescript
const config: ConfigTypes = {
  // Environment mode
  environment: "development" | "production",
  
  // Server settings
  server: {
    port: 3000,              // Server port
    cluster: false,          // Enable multi-core clustering
    ipHost: true,            // Show IP addresses on startup
    https: false,            // HTTPS mode (requires certificates)
  },
  
  // Logging configuration
  logging: {
    enabled: true,           // Enable request/response logging
    showDetails: true,       // Show detailed logs
  },
  
  // Built-in plugins
  plugins: {
    cors: {
      enabled: true,
      origins: ["*"],        // Allowed origins
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    rateLimit: {
      enabled: false,
      limit: 100,            // Max requests
      timeframe: 60000,      // Time window in ms
    },
  },
};
```

## Next Steps

Now that you have a basic application running, you can:

1. **Add More Controllers** - Organize your routes by feature
2. **Use Middleware** - Add request/response processing logic
3. **Add Validation** - Validate request data with DTOs
4. **Error Handling** - Implement proper error handling
5. **Deploy** - Deploy your application to production

### Recommended Reading

- [API Reference](./API.md) - Complete API documentation
- [Middleware Guide](./MIDDLEWARE.md) - Learn about middleware
- [Advanced Features](./ADVANCED.md) - Dive deeper into AzuraJS

### Examples

Check out the `examples/` directory in the repository for more complete examples:

- Basic CRUD operations
- Authentication
- File uploads
- Database integration
- And more!

## Getting Help

- 📚 [Documentation](https://github.com/0xviny/azurajs)
- 🐛 [Report Issues](https://github.com/0xviny/azurajs/issues)
- 💬 [Discussions](https://github.com/0xviny/azurajs/discussions)

Happy coding! 🚀
