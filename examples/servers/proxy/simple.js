const { AzuraClient } = require('../../../package/src');

// ============================================
// BACKEND SERVER (porta 4000)
// ============================================
const backend = new AzuraClient();

backend.get('/users', ({ res }) => {
  res.json({
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' }
    ]
  });
});

backend.get('/users/:id', ({ req, res }) => {
  res.json({
    id: req.params.id,
    name: `User ${req.params.id}`,
    email: `user${req.params.id}@example.com`
  });
});

backend.post('/users', ({ req, res }) => {
  res.json({
    message: 'User created',
    data: req.body
  });
});

backend.listen(4000);

// ============================================
// API GATEWAY (porta 3000)
// ============================================
const gateway = new AzuraClient();

// Rota principal
gateway.get('/', ({ res }) => {
  res.json({
    message: 'API Gateway',
    backend: 'http://localhost:4000',
    proxy: 'http://localhost:3000/api/*'
  });
});

// Proxy simples - todas as requisições /api/* vão para http://localhost:4000
gateway.proxy('/api', 'http://localhost:4000', {
  pathRewrite: { '^/api': '' },
  logLevel: 'info'
});

gateway.listen(3000);

console.log('\n✅ Servers running!');
console.log('\n📡 Gateway:');
console.log('   Main: http://localhost:3000/');
console.log('   Proxy: http://localhost:3000/api/users');
console.log('   Proxy: http://localhost:3000/api/users/1');
console.log('\n🔧 Backend:');
console.log('   Direct: http://localhost:4000/users');
console.log('\n💡 Test:');
console.log('   curl http://localhost:3000/api/users');
console.log('   curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d \'{"name":"David"}\'');
