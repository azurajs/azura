# 🚀 Release v1.0.3

## 🎉 Novas Funcionalidades

**Sistema de Plugins**
- ✨ Implementado sistema de plugins com suporte para CORS e Rate Limiting
- 🔒 **Plugin CORS**: Configuração completa com suporte para origens, métodos HTTP e headers permitidos
- ⏱️ **Plugin Rate Limiting**: Proteção contra abuso com limite de requisições por IP e janela de tempo configurável
- 🎛️ Plugins habilitados/desabilitados via arquivo de configuração

## 🔧 Melhorias

**Configuração**
- 📝 Sistema de configuração expandido com suporte para `plugins` no `azura.config.ts`
- 🔄 Tipos de configuração atualizados para suportar `methods` e `allowedHeaders` como string ou array
- ⚙️ Melhor flexibilidade na configuração de CORS (origins, methods, allowedHeaders)

**Logger**
- 🎨 Logger completamente reformulado com cores e níveis de log mais descritivos
- 🏷️ Prefixos coloridos por nível (`[Azura:INFO]`, `[Azura:WARN]`, `[Azura:ERROR]`)
- 📊 Mensagens mais claras para debug e monitoramento

**Server**
- 🔌 Integração automática de plugins durante inicialização do servidor
- 📢 Log de confirmação quando plugins são ativados
- 🧩 Melhor organização da inicialização do servidor com suporte a plugins

**Tipos**
- 📦 Adicionada interface `HttpContext` para melhor tipagem em plugins e middlewares
- 🎯 Novos tipos em `plugins/cors.type.ts` para configuração de CORS

## 📁 Arquivos Adicionados

- `package/src/shared/plugins/CORSPlugin.ts`
- `package/src/shared/plugins/RateLimitPlugin.ts`
- `package/src/types/plugins/cors.type.ts`

## 📝 Exemplo de Configuração

```typescript
const config: ConfigTypes = {
  plugins: {
    cors: {
      enabled: true,
      origins: ["*"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    rateLimit: {
      enabled: true,
      limit: 100,
      timeframe: 60000, // 1 minuto
    },
  },
};
```

## 🙏 Agradecimentos

Obrigado a todos que contribuíram para esta versão!
