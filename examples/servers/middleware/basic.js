const { AzuraClient } = require('../../../package/src');

const app = new AzuraClient();

// Middleware de logging
function logger(req, res, next) {
  const start = Date.now();
  console.log(`→ ${req.method} ${req.url}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`← ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
}

// Middleware de autenticação simples
function auth(req, res, next) {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (token !== 'Bearer secret-token') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
}

// Aplicar middleware global
app.use(logger);

// Rota pública
app.get('/', ({ res }) => {
  res.json({ message: 'Public route' });
});

// Rota protegida
app.get('/protected', auth, ({ res }) => {
  res.json({ message: 'Protected data', secret: 'This is secret!' });
});

app.listen(3000);

console.log('\n✅ Server running!');
console.log('   Public: http://localhost:3000/');
console.log('   Protected: http://localhost:3000/protected');
console.log('\n💡 Test protected route:');
console.log('   curl http://localhost:3000/protected');
console.log('   curl -H "Authorization: Bearer secret-token" http://localhost:3000/protected');
