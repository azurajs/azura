# Sistema de Proxy no AzuraJS

O AzuraJS oferece um sistema completo de proxy/reverse proxy para criar API Gateways, microsserviços e muito mais.

## Instalação

O sistema de proxy já vem incluído no AzuraJS, não precisa instalar nada adicional.

## Uso Básico

### Proxy Simples

```javascript
const { AzuraClient } = require('azurajs');

const app = new AzuraClient();

// Faz proxy de todas as requisições /api/* para http://localhost:4000
app.proxy('/api', 'http://localhost:4000', {
  pathRewrite: { '^/api': '' }
});

app.listen(3000);
```

**Exemplo de requisição:**
- Cliente faz: `GET http://localhost:3000/api/users`
- Proxy encaminha para: `GET http://localhost:4000/users`

### Com Path Rewrite

```javascript
app.proxy('/api/v1', 'http://localhost:4000', {
  pathRewrite: {
    '^/api/v1': '/api',  // Reescreve /api/v1 para /api
    '/old': '/new'        // Substitui /old por /new
  }
});
```

## Opções Avançadas

### ProxyOptions

```typescript
interface ProxyOptions {
  // URL do servidor de destino
  target: string;
  
  // Reescrever paths
  pathRewrite?: Record<string, string>;
  
  // Headers customizados
  headers?: Record<string, string>;
  
  // Timeout em ms (padrão: 30000)
  timeout?: number;
  
  // Seguir redirects
  followRedirects?: boolean;
  
  // Manter host original
  preserveHost?: boolean;
  
  // Nível de log: "none" | "info" | "debug"
  logLevel?: string;
  
  // Callbacks
  onProxyReq?: (proxyReq, req) => void;
  onProxyRes?: (proxyRes, req, res) => void;
  onError?: (err, req, res) => void;
}
```

### Exemplo com Todas as Opções

```javascript
app.proxy('/api', 'http://localhost:4000', {
  // Reescrever path
  pathRewrite: { '^/api': '' },
  
  // Headers customizados
  headers: {
    'X-Custom-Header': 'MyValue',
    'Authorization': 'Bearer token123'
  },
  
  // Timeout de 10 segundos
  timeout: 10000,
  
  // Log detalhado
  logLevel: 'debug',
  
  // Modificar requisição antes de enviar
  onProxyReq: (proxyReq, req) => {
    console.log(`Proxying ${req.method} ${req.url}`);
    proxyReq.setHeader('X-Request-ID', `req-${Date.now()}`);
  },
  
  // Modificar resposta antes de enviar ao cliente
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Response status: ${proxyRes.statusCode}`);
  },
  
  // Tratamento de erros customizado
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Gateway Error' });
  }
});
```

## Casos de Uso

### 1. API Gateway

Centralize todas as suas APIs em um único endpoint:

```javascript
const gateway = new AzuraClient();

// Múltiplos serviços
gateway.proxy('/users', 'http://localhost:4001');
gateway.proxy('/products', 'http://localhost:4002');
gateway.proxy('/orders', 'http://localhost:4003');

gateway.listen(3000);
```

### 2. Load Balancer Simples

```javascript
const backends = [
  'http://localhost:4001',
  'http://localhost:4002',
  'http://localhost:4003'
];

let currentIndex = 0;

app.use('/api', (req, res) => {
  const target = backends[currentIndex];
  currentIndex = (currentIndex + 1) % backends.length;
  
  const proxyMiddleware = createProxyMiddleware({
    target,
    pathRewrite: { '^/api': '' }
  });
  
  return proxyMiddleware(req, res);
});
```

### 3. Proxy para APIs Externas

```javascript
// Proxy para GitHub API
app.proxy('/github', 'https://api.github.com', {
  pathRewrite: { '^/github': '' },
  headers: {
    'User-Agent': 'MyApp/1.0'
  }
});

// Acesse: http://localhost:3000/github/users/octocat
```

### 4. Microserviços com Cache

```javascript
const cache = new Map();

function cacheMiddleware(req, res, next) {
  const key = req.url;
  if (cache.has(key)) {
    return res.json(cache.get(key));
  }
  
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    cache.set(key, data);
    return originalJson(data);
  };
  
  next();
}

app.get('/api/posts', 
  cacheMiddleware,
  createProxyMiddleware({
    target: 'https://jsonplaceholder.typicode.com',
    pathRewrite: { '^/api': '' }
  })
);
```

### 5. Autenticação no Gateway

```javascript
// Middleware de autenticação
function authMiddleware(req, res, next) {
  const token = req.headers.authorization;
  
  if (!token || !validateToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// Aplicar autenticação antes do proxy
app.use('/api', authMiddleware);
app.proxy('/api', 'http://localhost:4000', {
  pathRewrite: { '^/api': '' }
});
```

## Recursos Automáticos

O sistema de proxy automaticamente:

### 1. **Forwarding Headers**
```javascript
// Automaticamente adiciona:
'X-Forwarded-For': req.ip
'X-Forwarded-Proto': req.protocol
'X-Forwarded-Host': req.hostname
```

### 2. **Tratamento de Erros**
```javascript
// Erros comuns são tratados automaticamente:
- 502 Bad Gateway: Falha ao conectar
- 504 Gateway Timeout: Timeout
- 500 Internal Server Error: Erro de setup
```

### 3. **Suporte a Body**
```javascript
// Suporta automaticamente:
- JSON (application/json)
- Form data (application/x-www-form-urlencoded)
- Text plain
- Buffer/Stream
```

### 4. **Métodos HTTP**
```javascript
// Suporta todos os métodos:
GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
```

## Middleware Manual

Se precisar de mais controle, use `createProxyMiddleware`:

```javascript
const { createProxyMiddleware } = require('azurajs');

app.use('/api', createProxyMiddleware({
  target: 'http://localhost:4000',
  pathRewrite: { '^/api': '' },
  onProxyReq: (proxyReq, req) => {
    // Seu código aqui
  }
}));
```

## Exemplos Práticos

Execute os exemplos incluídos:

```bash
# Proxy básico
node examples/servers/proxy-simple.js

# Microserviços
node examples/servers/proxy-microservices.js

# Proxy avançado com APIs externas
node examples/servers/proxy-advanced.js

# Production-ready com cache e rate limiting
node examples/servers/proxy-production.js
```

## Debugging

Ative logs detalhados:

```javascript
app.proxy('/api', 'http://localhost:4000', {
  logLevel: 'debug'  // Mostra todas as requisições
});
```

## Performance

### Dicas de Otimização

1. **Use Cache** quando possível
2. **Configure timeout** adequado para suas APIs
3. **Implemente Rate Limiting** para proteger backends
4. **Use Connection Pooling** para muitas requisições
5. **Monitore** com logging apropriado

### Exemplo Production-Ready

```javascript
const app = new AzuraClient();

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

// Proxy com configurações otimizadas
app.proxy('/api', 'http://localhost:4000', {
  pathRewrite: { '^/api': '' },
  timeout: 5000,
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    res.status(502).json({ 
      error: 'Service Unavailable',
      requestId: req.headers['x-request-id']
    });
  }
});

app.listen(3000);
```

## Segurança

### Boas Práticas

1. **Sempre valide** headers antes de fazer proxy
2. **Implemente autenticação** no gateway
3. **Use HTTPS** para targets em produção
4. **Configure rate limiting** para prevenir abuse
5. **Sanitize** dados antes de fazer proxy

```javascript
// Exemplo seguro
app.use((req, res, next) => {
  // Remove headers sensíveis
  delete req.headers['x-internal-secret'];
  delete req.headers['x-admin-token'];
  next();
});

app.proxy('/api', 'https://backend.example.com', {
  headers: {
    'X-Gateway-Secret': process.env.GATEWAY_SECRET
  }
});
```

## Troubleshooting

### Problema: Timeout

```javascript
// Aumente o timeout
app.proxy('/api', 'http://slow-service.com', {
  timeout: 60000  // 60 segundos
});
```

### Problema: CORS

```javascript
// Adicione headers CORS no gateway
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});
```

### Problema: Path não está sendo reescrito

```javascript
// Verifique o regex do pathRewrite
app.proxy('/api/v1', 'http://localhost:4000', {
  pathRewrite: {
    '^/api/v1': ''  // Certifique-se que o ^ está presente
  },
  logLevel: 'debug'  // Ative logs para ver o que está acontecendo
});
```

## Comparação com outras bibliotecas

| Recurso | AzuraJS | http-proxy-middleware | Express |
|---------|---------|----------------------|---------|
| Setup | ✅ 1 linha | ⚠️ Múltiplas linhas | ⚠️ Precisa de pacote extra |
| Path Rewrite | ✅ Built-in | ✅ Built-in | ❌ Manual |
| Callbacks | ✅ onProxyReq, onProxyRes, onError | ✅ Similar | ⚠️ Depende do middleware |
| TypeScript | ✅ Full support | ⚠️ Parcial | ✅ Sim |
| Performance | ✅ Alta | ✅ Alta | ⚠️ Média |

## Contribuindo

Encontrou um bug ou tem uma sugestão? Abra uma issue no GitHub!

## License

MIT
