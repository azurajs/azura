# 🚀 Release v2.1.0 - Enhanced Modular Exports

## ✨ Novidades

### 📦 **Novos Exports Modulares**

Adicionamos novos pontos de entrada modulares para melhor organização e tree-shaking:

```typescript
// 🆕 Novos exports agrupados
import { cors, rateLimit } from "azurajs/plugins";
import { logger, parseQS, parseCookiesHeader, validateDto } from "azurajs/utils";
import { Server, Router, HttpError } from "azurajs/infra";
import { RequestHandler, HttpContext, RouteDefinition } from "azurajs/types";

// ✅ Exports individuais continuam funcionando
import { cors } from "azurajs/cors";
import { logger } from "azurajs/logger";
import { HttpError } from "azurajs/http-error";
```

**Novos módulos disponíveis:**
- `azurajs/plugins` - Todos os plugins (cors, rateLimit)
- `azurajs/utils` - Utilitários diversos (logger, parseQS, cookies, validators)
- `azurajs/infra` - Infraestrutura core (Server, Router, HttpError)
- `azurajs/types` - Todos os tipos TypeScript exportados

### 🎯 **Melhorias na Organização**

- ✅ Cada módulo agora possui seu próprio arquivo `index.ts`
- ✅ Exports mais consistentes e organizados
- ✅ Melhor suporte para IDEs e autocompletion
- ✅ Tree-shaking ainda mais eficiente

## 📝 Exports Completos Disponíveis

```typescript
// Principal
import { Server } from "azurajs";

// Decorators
import { Controller, Get, Post, Put, Delete, Patch, Head, Options } from "azurajs/decorators";
import { Req, Res, Next, Param, Query, Body, Headers, Ip, UserAgent } from "azurajs/decorators";

// Middleware
import { LoggingMiddleware, Middleware } from "azurajs/middleware";

// Tipos
import type { RequestServer, ResponseServer, RequestHandler, HttpContext } from "azurajs/types";
import type { RouteDefinition, ParamDefinition, ValidationSchema } from "azurajs/types";

// Infraestrutura
import { Server, Router, HttpError } from "azurajs/infra";

// Configuração
import { ConfigModule } from "azurajs/config";
import type { ConfigTypes } from "azurajs/config";

// Plugins (agrupados ou individuais)
import { cors, rateLimit } from "azurajs/plugins";
// OU
import { cors } from "azurajs/cors";
import { rateLimit } from "azurajs/rate-limit";

// Utilitários (agrupados ou individuais)
import { logger, parseQS, parseCookiesHeader, serializeCookie } from "azurajs/utils";
import { validateDto, validateSchema, getDtoValidators } from "azurajs/utils";
// OU
import { logger } from "azurajs/logger";
import { parseCookiesHeader, serializeCookie } from "azurajs/cookies";
import { validateDto, validateSchema } from "azurajs/validators";

// Routing
import { Router } from "azurajs/router";

// Errors
import { HttpError } from "azurajs/http-error";
```

## 🔄 Migração de v2.0.x

Nenhuma breaking change! Todos os imports antigos continuam funcionando:

```typescript
// ✅ Imports antigos continuam funcionando
import { Get, Post } from "azurajs/decorators";
import { cors } from "azurajs/cors";
import { logger } from "azurajs/logger";

// 🆕 Agora você também pode usar imports agrupados
import { cors, rateLimit } from "azurajs/plugins";
import { logger, parseQS } from "azurajs/utils";
```

## 📊 Comparação de Tamanho

| Método de Import | Bundle Size (gzip) |
|-----------------|-------------------|
| Import completo | ~45KB |
| Import modular individual | ~8-12KB |
| Import modular agrupado | ~15-20KB |

## 🐛 Correções

- Corrigida sintaxe JSON no package.json
- Melhorada consistência dos exports TypeScript
- Organizados arquivos index.ts para melhor estrutura

## 📦 Instalação

```bash
npm install azurajs@2.1.0
# ou
bun add azurajs@2.1.0
# ou
pnpm add azurajs@2.1.0
```

## 🔗 Links Úteis

- [Documentação Completa](https://azura.js.org/)
- [GitHub Repository](https://github.com/0xviny/azurajs)
- [NPM Package](https://www.npmjs.com/package/azurajs)

---

**Full Changelog**: https://github.com/0xviny/azurajs/compare/v2.0.1...v2.1.0
