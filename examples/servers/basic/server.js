const { AzuraClient } = require('../../../package/src');

const app = new AzuraClient();

// Rota principal
app.get('/', ({ res }) => {
  res.json({
    message: 'Hello from AzuraJS!',
    timestamp: new Date().toISOString(),
    routes: {
      users: '/users',
      user: '/users/:id',
      search: '/search?q=test'
    }
  });
});

// Rota com parâmetro
app.get('/users/:id', ({ req, res }) => {
  res.json({
    id: req.params.id,
    name: `User ${req.params.id}`,
    email: `user${req.params.id}@example.com`
  });
});

// Rota com query params
app.get('/search', ({ req, res }) => {
  const query = req.query.q || 'empty';
  const page = req.query.page || '1';
  
  res.json({
    query,
    page: parseInt(page),
    results: [`Result 1 for "${query}"`, `Result 2 for "${query}"`]
  });
});

// Rota POST
app.post('/users', ({ req, res }) => {
  res.status(201).json({
    message: 'User created',
    data: req.body
  });
});

app.listen(3000);

console.log('\n✅ Server running!');
console.log('   Main: http://localhost:3000/');
console.log('   User: http://localhost:3000/users/123');
console.log('   Search: http://localhost:3000/search?q=test&page=2');
console.log('\n   POST: curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d \'{"name":"John"}\'');
