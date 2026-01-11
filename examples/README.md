# AzuraJS Server Examples

Exemplos organizados por categoria. Execute com `bun run servers/<categoria>/<arquivo>`.

## 📁 Estrutura

### `/basic` - Exemplos Básicos
- `server.js` - Servidor básico com rotas simples
- `crud-api.js` - API CRUD completa
- `cookies.js` - Manipulação de cookies
- `error-handling.js` - Tratamento de erros

### `/middleware` - Middlewares
- `basic.js` - Logging e autenticação

### `/router` - Roteamento
- `prefix.js` - Routers com prefixos de caminho

### `/proxy` - Sistema de Proxy
- `simple.js` - Proxy básico entre dois servidores
- `microservices.js` - Gateway para microsserviços

### `/advanced` - Exemplos Avançados
- `bun-server.ts` - Usando Bun.serve
- `plugins.js` - Plugins (CORS, Rate Limit)

## 🚀 Quick Start

```bash
# Servidor básico
bun run servers/basic/server.js

# Proxy simples
bun run servers/proxy/simple.js

# Router modular
bun run servers/router/prefix.js

# Microsserviços
bun run servers/proxy/microservices.js
```

## 📖 Documentação

Para documentação completa sobre cada recurso:
- [Proxy System](../../docs/PROXY.md)
- [API Reference](../../docs/API.md)
- [Getting Started](../../docs/GETTING_STARTED.md)
