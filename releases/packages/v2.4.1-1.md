# Release v2.4.1-1 - Bug Fix: Return Type Handler

**Release Date:** January 12, 2026

## 🐛 Bug Fixes

### Fixed Return Type Error in Request Handlers

Fixed a critical type error that occurred when using `return res.*` methods in route handlers. The handler return types were too restrictive, causing TypeScript errors when trying to return response methods.

**Issue:** Route handlers would throw type errors when attempting to return response methods like `return res.json()`, `return res.send()`, etc.

**Solution:** Extended the return types of `TraditionalHandler` and `DestructuredHandler` to include `unknown`, allowing flexibility in return values while maintaining type safety.

#### Changes in `common.type.ts`

**Before:**
```typescript
type TraditionalHandler = (req: RequestServer, res: ResponseServer, next?: NextFunction) => void | Promise<void>;
type DestructuredHandler = (ctx: { req: RequestServer; res: ResponseServer; next?: NextFunction }) => void | Promise<void>;
```

**After:**
```typescript
type TraditionalHandler = (req: RequestServer, res: ResponseServer, next?: NextFunction) => void | Promise<void> | unknown;
type DestructuredHandler = (ctx: { req: RequestServer; res: ResponseServer; next?: NextFunction }) => void | Promise<void> | unknown;
```

#### Impact

This fix resolves type errors in patterns like:
- ✅ `return res.json({ data: "example" })`
- ✅ `return res.send("Hello")`
- ✅ `return res.status(200).json({ success: true })`
- ✅ Any other `return res.*` patterns

#### Files Modified
- `package/src/types/common.type.ts`

---

## 📦 Version Information

- **Version:** 2.4.1-1
- **Type:** Bug Fix (Patch)
- **Previous Version:** 2.4.1

## 🔄 Migration Guide

No migration required. This is a backward-compatible bug fix. Simply update your package:

```bash
npm install azurajs@2.4.1-1
# or
yarn add azurajs@2.4.1-1
# or
pnpm add azurajs@2.4.1-1
# or
bun add azurajs@2.4.1-1
```

---

**Full Changelog:** [v2.4.1...v2.4.1-1](https://github.com/azurajs/azurajs/compare/v2.4.1...v2.4.1-1)
