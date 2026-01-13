# 🚀 Release v2.0.0 - Major Architecture Upgrade

## ✨ Novidades Principais

### 📦 **Sistema de Imports Modulares (Tree-Shaking)**

AzuraJS agora suporta imports modulares para bundles até **70% menores**! Importe apenas o que você precisa:

```typescript
// ❌ Antes (v1.x) - Bundle completo
import { Controller, Get, HttpError, validateDto } from "azurajs";

// ✅ Agora (v2.0) - Imports modulares
import { Controller, Get } from "azurajs/decorators";
import { HttpError } from "azurajs/http-error";
import { validateDto } from "azurajs/validators";
```

**Módulos disponíveis:**
- `azurajs/decorators` - Todos os decorators (@Controller, @Get, @Post, etc)
- `azurajs/middleware` - Middleware utilities (createLoggingMiddleware, etc)
- `azurajs/http-error` - Classe HttpError
- `azurajs/validators` - validateSchema, validateDto
- `azurajs/cookies` - parseCookiesHeader, serializeCookie
- `azurajs/cors` - Plugin CORS
- `azurajs/rate-limit` - Plugin Rate Limiting
- `azurajs/logger` - Logger utility
- `azurajs/config` - Tipos de configuração
- `azurajs/types` - Tipos comuns (RequestHandler, etc)
- `azurajs/router` - Sistema de roteamento

### 🌐 **Fetch API para Runtimes Universais**

AzuraJS agora funciona nativamente em **Bun, Deno, Cloudflare Workers, e Vercel Edge**!

```typescript
import { AzuraClient } from "azurajs";

const app = new AzuraClient();

// Funciona em qualquer runtime!
export default {
  fetch: app.fetch.bind(app)
};
```

**Suporte completo para:**
- ✅ Node.js (v18+)
- ✅ Bun (v1.0+)
- ✅ Deno (v1.37+)
- ✅ Cloudflare Workers
- ✅ Vercel Edge Functions
- ✅ Qualquer runtime com Web Standard APIs

### 📚 **Documentação Completamente Renovada**

- 📖 Nova página: [Modular Imports Guide](/docs/en/modular-imports)
- 📖 Nova página: [Custom Servers Guide](/docs/en/custom-servers)
- 🌍 Documentação bilíngue completa (EN/PT)
- 📊 Exemplos para todos os runtimes
- 🎯 Guias de migração detalhados

## 🔧 Melhorias Técnicas

### Package.json Modernizado

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./decorators": {
      "types": "./dist/decorators/index.d.ts",
      "import": "./dist/decorators/index.js"
    },
    "./middleware": {
      "types": "./dist/middleware/index.d.ts",
      "import": "./dist/middleware/index.js"
    }
    // ... e mais 10 módulos
  }
}
```

### TypeScript 5.0+ Support

- ✅ Full type safety com imports modulares
- ✅ Tree-shaking automático
- ✅ IntelliSense aprimorado
- ✅ Suporte para `"DOM"` lib (Request/Response APIs)

## 📊 Comparação de Performance

### Bundle Size (Produção)

| Versão | Import Estilo | Bundle Size | Redução |
|--------|---------------|-------------|---------|
| v1.x | `import { ... } from "azurajs"` | ~50KB | - |
| v2.0 | Modular imports | ~15KB | **70%** ⬇️ |

### Compatibilidade de Runtimes

| Runtime | v1.x | v2.0 |
|---------|------|------|
| Node.js | ✅ | ✅ |
| Bun | ⚠️ (limitado) | ✅ (nativo) |
| Deno | ❌ | ✅ |
| Cloudflare Workers | ❌ | ✅ |
| Vercel Edge | ❌ | ✅ |

## 🔄 Breaking Changes

### 1. Imports Modulares (Recomendado)

**Antes (v1.x):**
```typescript
import {
  Controller,
  Get,
  Post,
  HttpError,
  validateDto,
  createLoggingMiddleware
} from "azurajs";
```

**Agora (v2.0):**
```typescript
// Opção 1: Imports modulares (RECOMENDADO)
import { Controller, Get, Post } from "azurajs/decorators";
import { HttpError } from "azurajs/http-error";
import { validateDto } from "azurajs/validators";
import { createLoggingMiddleware } from "azurajs/middleware";

// Opção 2: Import do pacote principal (ainda funciona)
import { Controller, Get, Post, HttpError } from "azurajs";
```

⚠️ **Nota:** Ambos os estilos funcionam, mas imports modulares são recomendados para produção!

### 2. TypeScript Configuration

Adicione `"DOM"` lib para suporte completo ao Fetch API:

```json
{
  "compilerOptions": {
    "lib": ["ES2022", "DOM"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 3. Custom Servers

Se você estava usando AzuraJS com servidores customizados, agora use o método `fetch()`:

**Antes (v1.x):**
```typescript
// Não havia suporte oficial
```

**Agora (v2.0):**
```typescript
import { AzuraClient } from "azurajs";

const app = new AzuraClient();

// Bun
Bun.serve({
  fetch: app.fetch.bind(app),
  port: 3000
});

// Deno
Deno.serve({ port: 3000 }, app.fetch.bind(app));

// Cloudflare Workers
export default {
  fetch: app.fetch.bind(app)
};
```

## 📖 Guia de Migração

### Passo 1: Atualizar package.json

```bash
npm install azurajs@2.0.0
# ou
bun add azurajs@2.0.0
```

### Passo 2: Atualizar tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["ES2022", "DOM"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Passo 3: Refatorar Imports (Opcional mas Recomendado)

Use find & replace no seu editor:

```typescript
// Buscar por:
import { Controller, Get, Post } from "azurajs";

// Substituir por:
import { Controller, Get, Post } from "azurajs/decorators";
```

**Tabela de Conversão:**

| Antes (v1.x) | Depois (v2.0) |
|--------------|---------------|
| `import { Controller, Get, Post, ... } from "azurajs"` | `import { Controller, Get, Post, ... } from "azurajs/decorators"` |
| `import { validateDto, validateSchema } from "azurajs"` | `import { validateDto, validateSchema } from "azurajs/validators"` |
| `import { HttpError } from "azurajs"` | `import { HttpError } from "azurajs/http-error"` |
| `import { createLoggingMiddleware } from "azurajs"` | `import { createLoggingMiddleware } from "azurajs/middleware"` |
| `import { parseCookiesHeader } from "azurajs"` | `import { parseCookiesHeader } from "azurajs/cookies"` |
| `import type { ConfigTypes } from "azurajs"` | `import type { ConfigTypes } from "azurajs/config"` |
| `import type { RequestHandler } from "azurajs"` | `import type { RequestHandler } from "azurajs/types"` |

### Passo 4: Testar

```bash
npm test
# ou execute sua aplicação
npm start
```

## 🎯 Exemplos Completos

### API REST Moderna (v2.0)

```typescript
import { AzuraClient, applyDecorators } from "azurajs";
import { Controller, Get, Post, Body, Param, Res } from "azurajs/decorators";
import { HttpError } from "azurajs/http-error";
import { createLoggingMiddleware } from "azurajs/middleware";
import type { ResponseServer } from "azurajs";

@Controller("/api/users")
class UserController {
  @Get()
  getAll(@Res() res: ResponseServer) {
    res.json({ users: [] });
  }

  @Get("/:id")
  getOne(@Param("id") id: string, @Res() res: ResponseServer) {
    if (id === "0") {
      throw new HttpError(404, "User not found");
    }
    res.json({ id, name: "User" });
  }

  @Post()
  create(@Body() body: any, @Res() res: ResponseServer) {
    res.status(201).json({ id: Date.now(), ...body });
  }
}

const app = new AzuraClient();
app.use(createLoggingMiddleware(app.getConfig()));
applyDecorators(app, [UserController]);

await app.listen(3000);
```

### Bun Server

```typescript
import { AzuraClient, applyDecorators } from "azurajs";
import { Controller, Get } from "azurajs/decorators";

@Controller("/")
class AppController {
  @Get()
  home() {
    return { message: "Hello from Bun!" };
  }
}

const app = new AzuraClient();
applyDecorators(app, [AppController]);

Bun.serve({
  fetch: app.fetch.bind(app),
  port: 3000,
});

console.log("🚀 Bun server running on http://localhost:3000");
```

### Cloudflare Worker

```typescript
import { AzuraClient, applyDecorators } from "azurajs";
import { Controller, Get } from "azurajs/decorators";

@Controller("/api")
class ApiController {
  @Get("/hello")
  hello() {
    return { message: "Hello from Cloudflare Edge!" };
  }
}

const app = new AzuraClient();
applyDecorators(app, [ApiController]);

export default {
  fetch: app.fetch.bind(app)
};
```

## 🐛 Correções

- 🔧 Fixed TypeScript type resolution com imports modulares
- 🔧 Fixed Headers.forEach() compatibility para Web APIs
- 🔧 Fixed protocol type assertion em custom servers
- 🔧 Improved error handling em runtimes edge

## 📦 O que permanece igual

- ✅ API de decorators (`@Controller`, `@Get`, `@Post`, etc)
- ✅ Sistema de middleware
- ✅ Cluster mode automático
- ✅ Configuração via `azura.config.ts`
- ✅ Zero dependencies
- ✅ TypeScript-first design
- ✅ Plugins (CORS, Rate Limit)

## 🎓 Recursos

- 📚 [Modular Imports Documentation](/docs/en/modular-imports)
- 🌐 [Custom Servers Guide](/docs/en/custom-servers)
- 🚀 [Migration Guide](/docs/en/migration-v2)
- 💬 [Discord Community](https://discord.gg/azurajs)
- 🐙 [GitHub Repository](https://github.com/azurajs/azurajs)

## 💡 Por que v2.0?

Esta é uma versão major porque:

1. **Mudança na estrutura de exports** - Embora retrocompatível, é uma mudança significativa na arquitetura do package
2. **Novo runtime support** - Suporte completo para runtimes modernos requer mudanças na API interna
3. **Modernização do ecossistema** - Alinhamento com padrões modernos de JavaScript/TypeScript

**Mas não se preocupe:** A API permanece **99% retrocompatível**. Você pode continuar usando imports do pacote principal!

## 🙏 Agradecimentos

Obrigado a todos os contribuidores e usuários que ajudaram a tornar o AzuraJS melhor!

## 📅 Informações da Release

- **Data de Release**: 09/01/2026
- **Versão**: 2.0.0
- **Node.js**: 18.0.0+
- **Bun**: 1.0.0+
- **Deno**: 1.37.0+
- **TypeScript**: 5.0.0+

## 🔮 Próximos Passos (v2.1)

- 🚀 WebSocket support
- 🔐 Built-in authentication middleware
- 📊 Performance monitoring tools
- 🧪 Testing utilities
- 📦 CLI para scaffolding

---

**Aproveite o AzuraJS v2.0!** 🎉

Se você encontrar algum problema, por favor [abra uma issue no GitHub](https://github.com/azurajs/azurajs/issues).
