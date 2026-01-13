# Release v2.4.1-2 - Critical Bug Fixes

**Release Date:** January 12, 2026

## 🐛 Critical Bug Fixes

### Request/Response Handler Issues
Fixed critical issues introduced in v2.4.1-1 that caused request handlers to malfunction:

#### Issue #1: Infinite Loading on Route Handlers
- **Problem:** Routes with 2-parameter handlers `(req, res)` would hang indefinitely
- **Cause:** Middleware chain was not properly advancing when `next()` was called
- **Fix:** Refactored `adaptRequestHandler` to properly handle the middleware chain by making the `next` callback call `ctx.next()` to advance the chain

#### Issue #2: Request/Response Objects Undefined
- **Problem:** `req` and `res` parameters were sometimes `undefined` in handlers
- **Cause:** Context was not properly passed between different handler types
- **Fix:** Added fallback logic to support both `ctx.request`/`ctx.response` and `ctx.req`/`ctx.res` patterns

#### Issue #3: Middleware Chain Not Executing
- **Problem:** Middlewares with 3 parameters `(req, res, next)` would execute but not continue the chain
- **Cause:** The `next()` callback was only resolving the local Promise but not calling the next middleware
- **Fix:** Made `next()` callback properly invoke `ctx.next()` to continue the middleware chain

## 🔧 Technical Improvements

### Type Safety Enhancements
Removed all `any` types from `RequestHandler.ts` following Object Calisthenics principles:

**New Type Definitions:**
- `NextFunction`: Typed function for next callback
- `AdapterContext`: Interface for request/response context
- `MiddlewareFunction`: 3-parameter middleware `(req, res, next)`
- `HandlerFunction`: 2-parameter handler `(req, res)`
- `ModernHandlerFunction`: 1-parameter modern handler `({ req, res, next })`
- `GenericHandler`: Union type for all handler types

### Handler Support Matrix

| Parameters | Type | Behavior | Example |
|------------|------|----------|---------|
| 3 params | `(req, res, next)` | Middleware that must call `next()` | `app.use((req, res, next) => { next(); })` |
| 2 params | `(req, res)` | Route handler (no next needed) | `app.get('/route', (req, res) => res.json({}))` |
| 1 param | `({ req, res, next })` | Modern destructured handler | `app.get('/', ({ req, res }) => res.json({}))` |
| Other | `(ctx)` | Full context fallback | Custom implementations |

## 📝 Code Changes

### Before (v2.4.1-1)
```typescript
export function adaptRequestHandler(mw: any) {
  return async (ctx: any) => {
    // Missing proper chain advancement
    const result = mw(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve(); // Only resolves locally
    });
  };
}
```

### After (v2.4.1-2)
```typescript
export function adaptRequestHandler(mw: GenericHandler) {
  return async (ctx: AdapterContext): Promise<void> => {
    const req = ctx.request || ctx.req;
    const res = ctx.response || ctx.res;
    
    if (mw.length === 3) {
      let nextCalled = false;
      
      const result = (mw as MiddlewareFunction)(req, res, async (err?: Error | unknown) => {
        if (nextCalled) return;
        nextCalled = true;
        
        if (err) throw err;
        
        if (ctx.next) {
          await ctx.next(); // Properly advances chain
        }
      });
      
      if (result && typeof (result as Promise<void>).then === "function") {
        await result;
      }
    }
    // ... other cases
  };
}
```

## ✅ Testing

All handler types now work correctly:

```typescript
// 2-parameter handler - Works ✅
app.get('/test', (req, res) => {
  res.json({ message: 'Works!' });
});

// 3-parameter middleware - Works ✅
app.use((req, res, next) => {
  console.log('Middleware executed');
  next();
});

// Async middleware - Works ✅
app.use(async (req, res, next) => {
  await doSomething();
  next();
});

// Modern handler - Works ✅
app.get('/modern', ({ req, res }) => {
  res.json({ modern: true });
});
```

## 🔄 Migration Guide

### From v2.4.1-1 to v2.4.1-2

**No breaking changes** - this is a drop-in replacement that fixes critical bugs.

If you're using middlewares with `next?.()` (optional chaining), you can safely change to `next()`:

```typescript
// Before (still works but not needed)
app.use((req, res, next) => {
  if (next) next();
});

// After (cleaner)
app.use((req, res, next) => {
  next();
});
```

## 📦 Installation

Update to the latest version:

```bash
npm install azurajs@2.4.1-2
# or
bun add azurajs@2.4.1-2
```

## 🙏 Acknowledgments

Thanks to the community for quickly reporting these critical issues. Special thanks to the developers who provided detailed reproduction cases.

---

**Full Changelog:** v2.4.1-1...v2.4.1-2
