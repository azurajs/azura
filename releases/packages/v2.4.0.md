# Release v2.4.0 - Advanced Validation, Cookies, Logger & Type Extensions

**Release Date:** January 11, 2026

## 🎉 What's New

### Zod-like Validation System
AzuraJS now includes a powerful type-safe validation library inspired by Zod! Validate request data with a clean, declarative API and full TypeScript type inference.

### Advanced Cookie Management
Complete cookie system with signing, encryption, sessions, and cookie jar management. Build secure applications with enterprise-grade cookie handling.

### Enhanced Logger
New customizable logging system with ANSI colors (hex, RGB, predefined), emoji icons, timestamps, and configurable log levels. Beautiful console output out of the box.

### Type Extension System
Officially support module augmentation to extend Request, Response, and AzuraClient with custom properties and methods. Full TypeScript support included.

### IP Resolution
Advanced IP resolution with proxy trust configuration supporting boolean, number, string, and CIDR ranges. Perfect for applications behind load balancers.

## ✨ Features

### 🔍 Validation System

#### Functionalities
- **Type-safe validators**: String, Number, Boolean, Date, Array, Object, Enum, Literal, Union
- **Type inference**: Full TypeScript type inference with `Infer<typeof schema>`
- **Chaining methods**: Min, max, email, url, regex, pattern matching
- **Custom validation**: Use `.refine()` for custom logic
- **Parse modes**: `.parse()` (throws), `.safeParse()` (returns result)
- **Error formatting**: `.format()` for structured error output

#### Basic Example

```typescript
import { v } from 'azurajs';

// Define schema
const userSchema = v.object({
  name: v.string().min(3).max(50),
  email: v.string().email(),
  age: v.number().min(18).max(120),
  role: v.enum(['admin', 'user', 'guest']),
  isActive: v.boolean().default(true)
});

// Type inference
type User = Infer<typeof userSchema>;

// Validate
app.post('/users', (req, res) => {
  const result = userSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json(result.format());
  }
  
  const user: User = result.data;
  res.json({ success: true, user });
});
```

#### Advanced Validation

```typescript
// Nested objects
const addressSchema = v.object({
  street: v.string(),
  city: v.string(),
  zipCode: v.string().regex(/^\d{5}(-\d{4})?$/)
});

const userWithAddress = v.object({
  name: v.string(),
  address: addressSchema
});

// Arrays
const numbersSchema = v.array(v.number().positive());
const usersSchema = v.array(userSchema);

// Union types
const idSchema = v.union([
  v.string().uuid(),
  v.number().int()
]);

// Custom validation
const passwordSchema = v.string()
  .min(8)
  .refine(
    (val) => /[A-Z]/.test(val),
    'Must contain uppercase letter'
  )
  .refine(
    (val) => /[0-9]/.test(val),
    'Must contain number'
  );
```

### 🍪 Cookie Management System

#### Functionalities
- **CookieJar**: Centralized cookie management
- **Signed Cookies**: HMAC-SHA256 signature verification
- **Encrypted Cookies**: AES-256-CBC encryption
- **Sessions**: Built-in session manager with pluggable stores
- **Cookie Presets**: Common configurations (strict, lax, secure)

#### Basic Usage

```typescript
import { CookieJar, CookiePresets } from 'azurajs';

const jar = new CookieJar({ secret: 'your-secret-key' });

app.post('/login', (req, res) => {
  // Set signed cookie
  jar.set(res, 'userId', '12345', {
    signed: true,
    httpOnly: true,
    secure: true,
    maxAge: 86400000 // 24 hours
  });
  
  res.json({ message: 'Logged in' });
});

app.get('/profile', (req, res) => {
  // Get signed cookie
  const userId = jar.get(req, 'userId', { signed: true });
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ userId });
});
```

#### Session Management

```typescript
import { SessionManager } from 'azurajs';

const sessions = new SessionManager({
  secret: 'session-secret',
  cookieName: 'sessionId',
  ttl: 3600000 // 1 hour
});

app.post('/login', async (req, res) => {
  const sessionId = await sessions.create(req, res, {
    userId: '123',
    role: 'admin'
  });
  
  res.json({ message: 'Session created' });
});

app.get('/dashboard', async (req, res) => {
  const session = await sessions.get(req);
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({ user: session.data });
});
```

#### Encrypted Cookies

```typescript
const jar = new CookieJar({
  secret: 'your-secret-key',
  encryptionKey: 'your-32-byte-encryption-key-here!!'
});

// Set encrypted cookie
jar.set(res, 'sensitive', { cardNumber: '1234-5678' }, {
  encrypted: true,
  httpOnly: true,
  secure: true
});

// Get encrypted cookie
const data = jar.get(req, 'sensitive', { encrypted: true });
```

### 📊 Enhanced Logger

#### Functionalities
- **Log levels**: `debug`, `info`, `warn`, `error`, `success`
- **ANSI colors**: Hex (`#FF5733`), RGB (`rgb(255, 87, 51)`), predefined names
- **Emoji icons**: Built-in emoji support for visual distinction
- **Timestamps**: `time`, `datetime`, `iso` formats
- **Configurable**: Enable/disable colors, icons, timestamps

#### Basic Usage

```typescript
import { log, configureLogger } from 'azurajs';

// Configure logger
configureLogger({
  enableColors: true,
  enableIcons: true,
  timestampFormat: 'datetime',
  minLevel: 'debug'
});

// Use logger
log.info('Server started', { port: 3000 });
log.success('User created', { id: 123 });
log.warn('Rate limit approaching', { requests: 95 });
log.error('Database connection failed', { error: 'ECONNREFUSED' });
log.debug('Request received', { method: 'GET', path: '/api' });
```

#### Custom Colors

```typescript
import { log, color } from 'azurajs';

// Hex colors
log.info(color.hex('#00FF00', 'Success message'));

// RGB colors
log.info(color.rgb(255, 165, 0, 'Warning message'));

// Predefined colors
log.info(color.cyan('Info message'));
log.error(color.red('Error message'));

// Multiple styles
log.info(
  color.bold(
    color.hex('#FF00FF', 'Important notice')
  )
);
```

#### Request Logging

```typescript
import { createLoggingMiddleware } from 'azurajs';

app.use(createLoggingMiddleware({
  includeBody: true,
  includeHeaders: false,
  excludePaths: ['/health', '/metrics']
}));

// Logs: [2026-01-11 15:30:45] ℹ️  GET /api/users 200 - 45ms
```

### 🔧 Type Extension System

#### Functionalities
- **Module augmentation**: Extend core types safely
- **TypeScript support**: Full IntelliSense and type checking
- **JavaScript compatible**: Works with plain JavaScript too
- **Custom properties**: Add properties to Request/Response
- **Custom methods**: Extend AzuraClient with helpers

#### Extending Request/Response

```typescript
// In your types file (e.g., types/extensions.d.ts)
declare module 'azurajs' {
  interface RequestServer {
    user?: { id: string; role: string };
    isAuthenticated(): boolean;
  }
  
  interface ResponseServer {
    sendSuccess(data: any, message?: string): this;
    sendError(message: string, code?: number): this;
  }
}

// Implement the extensions
app.use((req, res, next) => {
  req.isAuthenticated = function() {
    return !!this.user;
  };
  
  res.sendSuccess = function(data, message) {
    return this.status(200).json({
      success: true,
      message: message || 'Success',
      data,
      timestamp: new Date().toISOString()
    });
  };
  
  res.sendError = function(message, code = 400) {
    return this.status(code).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  };
  
  next();
});

// Use custom methods
app.get('/api/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.sendError('Unauthorized', 401);
  }
  
  res.sendSuccess(req.user);
});
```

#### Extending AzuraClient

```typescript
declare module 'azurajs' {
  interface AzuraClient {
    health(path?: string): void;
    enableSwagger(config?: SwaggerConfig): void;
  }
}

// Implement custom methods
AzuraClient.prototype.health = function(path = '/health') {
  this.get(path, (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });
};

// Use it
const app = new AzuraClient();
app.health('/status'); // Automatically creates health check endpoint
```

### 🌐 IP Resolution

#### Functionalities
- **Proxy trust**: Boolean, number, string, or array of CIDR ranges
- **Common presets**: `COMMON_PROXY_RANGES` for popular services
- **X-Forwarded-For**: Automatic parsing and validation
- **Security**: Safe IP extraction behind proxies

#### Configuration

```typescript
import { AzuraClient, COMMON_PROXY_RANGES } from 'azurajs';

// Trust all proxies
const app = new AzuraClient({
  trustProxy: true
});

// Trust first N proxies
const app = new AzuraClient({
  trustProxy: 2
});

// Trust specific CIDR ranges
const app = new AzuraClient({
  trustProxy: [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    ...COMMON_PROXY_RANGES // Cloudflare, AWS, etc.
  ]
});

app.get('/api/location', (req, res) => {
  const clientIp = req.ip; // Correctly resolved based on trustProxy
  res.json({ ip: clientIp });
});
```

## 📖 Documentation Improvements

### New Documentation Pages
- **Validation**: Complete guide with all validators and examples
- **Cookies**: Cookie management, signing, encryption, sessions
- **Logger**: Customization, colors, icons, timestamps
- **Type Extensions**: Module augmentation guide with TypeScript/JavaScript examples
- **IP Resolution**: Proxy configuration and trust settings

### Enhanced Examples
- Added `validator.example.ts` with comprehensive validation patterns
- Added `cookies.example.ts` showing signed/encrypted cookies
- Added `type-extensions.example.ts` with custom properties/methods
- Added `ip-resolution.example.ts` with proxy configurations

### Language Support
- All new features documented in English
- Portuguese translations available for validation and cookies
- Navigation updated in both languages

## 🔧 Technical Details

### New Exports

```typescript
// Validation
export { v, Infer } from 'azurajs';

// Cookies
export { 
  CookieJar, 
  SessionManager, 
  CookiePresets,
  type CookieOptions,
  type SessionData,
  type SessionStore
} from 'azurajs';

// Logger
export { 
  log, 
  configureLogger, 
  color,
  type LoggerConfig,
  type LogLevel
} from 'azurajs';

// IP Resolution
export {
  resolveIp,
  COMMON_PROXY_RANGES,
  type IpResolverConfig
} from 'azurajs';
```

### Type Safety

All new features include full TypeScript support:
- Validation schemas infer types automatically
- Cookie options are fully typed
- Logger configuration has type-safe options
- Type extensions work with IntelliSense

### Performance

- Validation is optimized for speed
- Cookie operations use native crypto APIs
- Logger has minimal overhead
- IP resolution uses efficient CIDR matching

## 🚀 Migration Guide

### From v2.3.0

No breaking changes! All new features are additive:

```typescript
// Old code continues to work
app.get('/users', (req, res) => {
  res.json({ users: [] });
});

// New features are opt-in
import { v } from 'azurajs';

const schema = v.object({
  name: v.string()
});

app.post('/users', (req, res) => {
  const result = schema.safeParse(req.body);
  if (result.success) {
    res.json(result.data);
  }
});
```

### Recommended Updates

1. **Add validation** to POST/PUT endpoints
2. **Use signed cookies** for authentication
3. **Configure logger** for better debugging
4. **Set trustProxy** if behind load balancer
5. **Add type extensions** for custom helpers

## 📦 Package Updates

- Version: `2.3.0` → `2.4.0`
- No breaking changes
- Backward compatible with all v2.x versions
- Zero new dependencies (still dependency-free!)

## 🎯 Use Cases

### API with Validation

```typescript
import { AzuraClient, v, Infer } from 'azurajs';

const app = new AzuraClient();

const createUserSchema = v.object({
  name: v.string().min(3).max(50),
  email: v.string().email(),
  age: v.number().min(18).optional()
});

type CreateUser = Infer<typeof createUserSchema>;

app.post('/users', (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json(result.format());
  }
  
  const user: CreateUser = result.data;
  // Create user in database...
  res.status(201).json({ user });
});

app.listen(3000);
```

### Secure Authentication

```typescript
import { AzuraClient, CookieJar } from 'azurajs';

const app = new AzuraClient();
const jar = new CookieJar({ secret: process.env.COOKIE_SECRET! });

app.post('/login', (req, res) => {
  // Validate credentials...
  jar.set(res, 'userId', user.id, {
    signed: true,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 86400000
  });
  
  res.json({ message: 'Logged in' });
});

app.get('/profile', (req, res) => {
  const userId = jar.get(req, 'userId', { signed: true });
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Fetch user profile...
  res.json({ profile });
});

app.listen(3000);
```

### Custom Response Helpers

```typescript
import { AzuraClient } from 'azurajs';

declare module 'azurajs' {
  interface ResponseServer {
    sendSuccess(data: any): this;
    sendError(message: string, code?: number): this;
  }
}

const app = new AzuraClient();

app.use((req, res, next) => {
  res.sendSuccess = function(data) {
    return this.status(200).json({
      success: true,
      data,
      timestamp: Date.now()
    });
  };
  
  res.sendError = function(message, code = 400) {
    return this.status(code).json({
      success: false,
      error: message,
      timestamp: Date.now()
    });
  };
  
  next();
});

app.get('/users', (req, res) => {
  res.sendSuccess({ users: [] });
});

app.listen(3000);
```

## 🙏 Acknowledgments

Special thanks to:
- The Zod library for validation API inspiration
- Express.js for cookie patterns
- Winston for logger patterns
- All contributors and community members

## 🔗 Links

- 📚 [Full Documentation](https://azurajs.com/docs)
- 🐛 [Report Issues](https://github.com/0xviny/azurajs/issues)
- 💬 [Discussions](https://github.com/0xviny/azurajs/discussions)
- 📦 [npm Package](https://www.npmjs.com/package/azurajs)

---

**Happy Coding with AzuraJS v2.4.0! 🚀**
