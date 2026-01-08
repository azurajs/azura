# Contributing to AzuraJS

First off, thank you for considering contributing to AzuraJS! 🎉

It's people like you that make AzuraJS such a great tool for building web applications.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Project Structure](#project-structure)

## Code of Conduct

This project and everyone participating in it is governed by common sense and respect. By participating, you are expected to uphold this code. Please report unacceptable behavior to 0xviny.dev@gmail.com.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed and what you expected to see**
* **Include code samples and error messages**
* **Specify which version of AzuraJS you're using**
* **Specify your Node.js/Bun version and OS**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the feature**
* **Explain why this enhancement would be useful**
* **List some other frameworks where this enhancement exists, if applicable**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the TypeScript styleguide
* End all files with a newline
* Write meaningful commit messages

## Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/azurajs.git
cd azurajs
```

2. **Install dependencies**

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

3. **Run the examples**

```bash
cd examples
bun install
bun run start
```

4. **Make your changes in the `package/src` directory**

## Pull Request Process

1. **Create a new branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make your changes**
   - Write or update tests as needed
   - Update documentation if you're changing functionality
   - Keep your changes focused - one feature/fix per PR

3. **Test your changes**

```bash
cd examples
bun run start
# Test manually or add automated tests
```

4. **Commit your changes**

```bash
git add .
git commit -m "feat: add amazing feature"
# or
git commit -m "fix: resolve issue with routing"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

5. **Push to your fork**

```bash
git push origin feature/your-feature-name
```

6. **Open a Pull Request**
   - Go to the original AzuraJS repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template with all relevant information
   - Link any related issues

## Coding Guidelines

### TypeScript Style

- Use TypeScript for all code
- Enable strict mode
- Avoid `any` types when possible - use proper type definitions
- Use interfaces for object shapes
- Use type aliases for unions and complex types

### Code Style

```typescript
// ✅ Good
export class MyController {
  @Get("/users/:id")
  getUser(@Param("id") id: string, @Res() res: ResponseServer) {
    res.json({ id });
  }
}

// ❌ Bad
export class MyController {
  @Get("/users/:id")
  getUser(@Param("id") id: any, @Res() res: any) {
    res.json({id})
  }
}
```

### Naming Conventions

- **Classes**: PascalCase (e.g., `UserController`, `AzuraClient`)
- **Functions/Methods**: camelCase (e.g., `getUser`, `parseBody`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PORT`, `MAX_RETRIES`)
- **Files**: PascalCase for classes, camelCase for utilities
- **Decorators**: PascalCase (e.g., `@Get`, `@Controller`)

### Comments

- Write self-documenting code when possible
- Add JSDoc comments for public APIs
- Explain "why" not "what" in comments
- Keep comments up-to-date with code changes

```typescript
/**
 * Parses cookies from the Cookie header string
 * @param cookieHeader - The raw Cookie header value
 * @returns Object with cookie name-value pairs
 */
export function parseCookiesHeader(cookieHeader: string): Record<string, string> {
  // Implementation
}
```

### Error Handling

- Always handle errors appropriately
- Use HttpError for HTTP-related errors
- Provide meaningful error messages
- Log errors appropriately

```typescript
if (!user) {
  throw new HttpError(404, "User not found");
}
```

## Project Structure

```
azurajs/
├── package/                 # Main package source
│   ├── src/
│   │   ├── decorators/     # Route decorators (@Get, @Post, etc.)
│   │   ├── infra/          # Core infrastructure (Server, Router)
│   │   ├── middleware/     # Built-in middleware
│   │   ├── shared/         # Shared modules (config, plugins)
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── package.json
├── examples/               # Example applications
├── docs/                   # Documentation
└── releases/              # Release notes
```

### Key Files

- **Server.ts**: Main server implementation
- **Router.ts**: Routing logic and route matching
- **Route.ts**: Decorator implementations
- **ConfigModule.ts**: Configuration management
- **RequestHandler.ts**: Request handler adapter

## Testing Guidelines

Currently, AzuraJS uses manual testing through the examples directory. When adding new features:

1. Add a new controller or route in the examples directory
2. Test all edge cases manually
3. Document the test cases in your PR

*Note: Automated testing suite is planned for future releases. Contributions welcome!*

## Documentation

When adding new features, please update:

- **README.md** - If it affects the main API
- **Examples** - Add practical examples
- **Type definitions** - Keep types up-to-date
- **JSDoc comments** - For public APIs

## Questions?

Feel free to:
- Open an issue for questions
- Join discussions in existing issues
- Email the maintainer at 0xviny.dev@gmail.com

## Recognition

Contributors will be recognized in:
- The repository's README
- Release notes
- The project's contributors page

Thank you for contributing to AzuraJS! 🚀
