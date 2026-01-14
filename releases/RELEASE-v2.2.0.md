# Release v2.2.0 - JavaScript Support & Enhanced Documentation

**Release Date:** January 10, 2026

## 🎉 What's New

### JavaScript Support
AzuraJS now officially supports plain JavaScript alongside TypeScript! While the framework is TypeScript-first, developers can now use it seamlessly with JavaScript projects.

## ✨ Features

### 📝 Complete JavaScript Documentation
- Added comprehensive JavaScript examples in README
- JavaScript Quick Start guide
- CRUD API examples in pure JavaScript
- Middleware patterns for JavaScript
- Cookie handling examples in JavaScript
- Query parameter handling in JavaScript

### 📚 New JavaScript Examples
- **Functional Style Server** - Simple server setup without decorators
- **CRUD API** - Complete REST API implementation in JavaScript
- **Middleware** - Custom authentication and logging middleware
- **Cookie Management** - Setting, reading, and clearing cookies
- **Query Parameters** - Handling search and filter parameters

## 📖 Documentation Improvements

### Enhanced README
- JavaScript support badge in features list
- Side-by-side TypeScript and JavaScript examples
- Clear runtime requirements for both languages
- Updated configuration examples for JavaScript

### JavaScript Code Examples
All examples now include JavaScript versions:
```javascript
import { AzuraClient } from "azurajs";

const app = new AzuraClient();

app.get("/", (req, res) => {
  res.json({ message: "Hello from JavaScript!" });
});

await app.listen();
```

## 🔧 Technical Details

### Runtime Support
- **Bun** - Native TypeScript and JavaScript support
- **Node.js** - Via tsx, ts-node, or bundlers (esbuild, swc, webpack)
- **Deno** - Native TypeScript support

### Usage Patterns
The framework supports two main patterns:

1. **TypeScript with Decorators** (recommended for type safety)
```typescript
@Controller("/api")
class UserController {
  @Get("/users")
  getUsers(@Res() res: ResponseServer) {
    res.json({ users: [] });
  }
}
```

2. **JavaScript Functional Style** (flexible and simple)
```javascript
app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});
```

## 🎯 Developer Experience

### For TypeScript Developers
- Full type safety and IntelliSense
- Decorator-based routing
- Type inference for request/response objects
- No changes to existing TypeScript code

### For JavaScript Developers
- No transpilation complexity for simple projects
- Express-like functional API
- Access to all framework features
- Easy migration path to TypeScript when needed

## 📦 Package Updates

- Version: `2.1.2` → `2.2.0`
- No breaking changes
- Backward compatible with all v2.x versions
- Zero new dependencies

## 🚀 Getting Started with JavaScript

### Installation
```bash
npm install azurajs
```

### Quick Start
```javascript
import { AzuraClient } from "azurajs";

const app = new AzuraClient();

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

await app.listen();
```

## 📝 Migration Notes

### From v2.1.x to v2.2.0
No migration needed! This release is fully backward compatible. JavaScript support is additive and doesn't affect existing TypeScript codebases.

### New JavaScript Projects
- Use functional routing style: `app.get()`, `app.post()`, etc.
- Configuration files can be `.js` instead of `.ts`
- No decorators required (but optional via Babel/TypeScript)

## 🔗 Resources

- [Documentation](https://azura.js.org/docs/en)
- [JavaScript Examples](https://github.com/azurajs/azura/tree/main/examples)
- [GitHub Repository](https://github.com/azurajs/azura)
- [NPM Package](https://www.npmjs.com/package/azurajs)

## 🙏 Acknowledgments

Thanks to the community for requesting JavaScript support! This release makes AzuraJS accessible to a broader audience while maintaining the TypeScript-first philosophy.

## 🐛 Bug Fixes

None in this release - focus was on documentation and examples.

## ⚠️ Breaking Changes

None. This is a minor version bump with new features only.

---

**Full Changelog**: https://github.com/azurajs/azura/compare/v2.1.2...v2.2.0

**Install**: `npm install azurajs@2.2.0`
