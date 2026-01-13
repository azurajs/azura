# Release v2.5.0 - Swagger/OpenAPI 3.0 Integration

**Release Date:** January 13, 2026

## 🎉 Major Features

### Complete Swagger/OpenAPI 3.0 Documentation System

AzuraJS agora inclui um sistema completo de documentação de API com Swagger/OpenAPI 3.0, oferecendo documentação interativa moderna com interface premium dark mode.

#### ✨ Key Features

**Decorators para Documentação:**
- `@ApiDoc()` - Documentar endpoints com summary e description
- `@ApiResponse()` - Definir respostas com status codes e exemplos
- `@ApiParameter()` - Documentar parâmetros (path, query, header)
- `@ApiBody()` - Documentar request body com exemplos
- `@ApiTags()` - Organizar endpoints por tags
- `@ApiSecurity()` - Especificar esquemas de autenticação
- `@ApiDeprecated()` - Marcar endpoints deprecados

**Modern UI Features:**
- 🎨 Interface dark mode premium (inspirada em Stripe/Vercel)
- 🔍 Busca em tempo real de endpoints
- 📱 Totalmente responsivo
- 🚀 "Try It Out" interativo para testar endpoints
- ⚡ Tempo de resposta exibido
- 📋 Copiar código com um clique
- 🎯 Navegação sidebar com agrupamento por tags

**Developer Experience:**
```typescript
// Setup super simples - uma linha!
import { setupSwaggerWithControllers } from "azurajs/swagger";

setupSwaggerWithControllers(app, {
  title: "My API",
  description: "API documentation",
  version: "1.0.0"
}, [UserController, ProductController]);

// Acesse:
// http://localhost:3000/docs - UI interativa
// http://localhost:3000/api-spec.json - OpenAPI JSON
```

**Exemplo de Controller com Swagger:**
```typescript
import { Controller, Get, Post, Req, Res } from "azurajs/decorators";
import { ApiDoc, ApiResponse, ApiBody, ApiTags } from "azurajs/swagger";

@Controller("/users")
@ApiTags("Users")
class UserController {
  @Get("/:id")
  @ApiDoc({ 
    summary: "Get user by ID",
    description: "Retrieve detailed user information"
  })
  @ApiResponse(200, "User found", {
    example: { id: 1, name: "John Doe", email: "john@example.com" }
  })
  @ApiResponse(404, "User not found")
  async getUser(@Req() req, @Res() res) {
    res.json({ id: req.params.id, name: "John Doe" });
  }

  @Post("/")
  @ApiDoc({ summary: "Create new user" })
  @ApiBody({
    description: "User data",
    example: { name: "Jane Doe", email: "jane@example.com" }
  })
  @ApiResponse(201, "User created")
  async createUser(@Req() req, @Res() res) {
    res.status(201).json({ id: 2, ...req.body });
  }
}
```

#### 📦 Architecture

**Modular Structure:**
- `swagger-ui-modern.html` - Interface HTML limpa
- `swagger-ui-modern.css` - Estilos separados (~800 linhas)
- `swagger-ui-modern.js` - Lógica JavaScript separada (~400 linhas)

**Importação Limpa:**
```typescript
// Tudo disponível via submodule
import { 
  setupSwaggerWithControllers,
  ApiDoc, 
  ApiResponse,
  ApiTags 
} from "azurajs/swagger";
```

**Automatic Route Discovery:**
- Sistema automático de descoberta de rotas via `getControllerMetadata()`
- Não é necessário passar lista manual de rotas
- Suporta prefixos de controllers
- Extrai parâmetros automaticamente dos paths

#### 🛠️ Technical Implementation

**OpenAPI 3.0 Type System:**
- TypeScript types completos para OpenAPI specification
- Interfaces para: Document, PathItem, Operation, Parameter, Schema, Response, Components
- Type-safe configuration e metadata

**SwaggerGenerator:**
- Geração automática de spec OpenAPI 3.0
- Inferência de schemas TypeScript → OpenAPI
- Suporte a examples, descriptions, deprecation
- Merge inteligente de metadata de múltiplos decorators

**SwaggerIntegration:**
- Rotas automáticas: `GET /docs` e `GET /api-spec.json`
- Serving de arquivos estáticos (CSS/JS)
- Template replacement para títulos e versões
- Configuração de servidores múltiplos

#### 📚 Documentation

**Novos Arquivos:**
- `docs/SWAGGER.md` - Documentação completa do sistema
- `docs/SWAGGER_QUICKSTART.md` - Guia rápido de início
- `examples/servers/swagger-simple.ts` - Exemplo básico
- `examples/servers/swagger-complete.ts` - Exemplo completo

**Build Configuration:**
- Adicionado `swagger` entry point no `tsup.config.ts`
- Export mapping no `package.json` para `"azurajs/swagger"`
- Arquivos CSS/JS servidos via rotas `/swagger-ui-modern.*`

## 🔧 Improvements

### Export Structure Refinement
- Removidos exports de Swagger do pacote principal (`azurajs`)
- Swagger agora é submódulo dedicado (`azurajs/swagger`)
- Mantém o core framework limpo e modular

### Type Safety
- Zero uso de `any` types no código Swagger
- Strong typing para toda OpenAPI specification
- Type-safe decorator parameters

### Developer Experience
- Setup reduzido de ~20 linhas para 1 linha
- Auto-discovery elimina configuração manual
- Import limpo via submódulo dedicado

## 📝 Pull Request #10

Merged community contribution:
- Melhorias na estrutura de exportação
- Refinamentos de tipos TypeScript
- Otimizações de performance

## 🚀 Migration Guide

### From v2.4.x to v2.5.0

**No Breaking Changes** - Esta é uma release backwards-compatible!

**Adicionando Swagger (Opcional):**
```typescript
// Antes (sem Swagger)
app.registerController(MyController);

// Depois (com Swagger)
import { setupSwaggerWithControllers } from "azurajs/swagger";

setupSwaggerWithControllers(app, {
  title: "My API",
  version: "1.0.0"
}, [MyController]);
```

**Adicionando Documentação:**
```typescript
import { ApiDoc, ApiResponse } from "azurajs/swagger";

@Controller("/api")
class MyController {
  @Get("/hello")
  @ApiDoc({ summary: "Say hello" })
  @ApiResponse(200, "Success")
  async hello(@Req() req, @Res() res) {
    res.json({ message: "Hello World" });
  }
}
```

## 📦 Installation

```bash
npm install azurajs@2.5.0
# or
yarn add azurajs@2.5.0
# or
pnpm add azurajs@2.5.0
# or
bun add azurajs@2.5.0
```

## 🔗 Resources

- **Documentation:** [docs/SWAGGER.md](../docs/SWAGGER.md)
- **Quick Start:** [docs/SWAGGER_QUICKSTART.md](../docs/SWAGGER_QUICKSTART.md)
- **Examples:** [examples/servers/swagger-simple.ts](../examples/servers/swagger-simple.ts)
- **Live Demo:** Run `bun run examples/servers/swagger-simple.ts` and visit `http://localhost:3000/docs`

## 🙏 Credits

Special thanks to:
- Beta testers who provided feedback on Swagger UI
- All users who requested OpenAPI documentation support

## 📊 Stats

- **New Files:** 12
- **Lines of Code Added:** ~3,500
- **TypeScript Types:** 40+ new interfaces
- **New Decorators:** 7
- **Documentation Pages:** 2
- **Examples:** 2

---

**Full Changelog:** https://github.com/azurajs/azurajs/compare/v2.4.1-2...v2.5.0

**Contributors:** @ThisPythonJS @gui-df @dorpew
