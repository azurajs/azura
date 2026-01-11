const { AzuraClient } = require('../../../package/src');

const app = new AzuraClient();

// Banco de dados simulado
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

// Página principal
app.get('/', ({ res }) => {
  res.json({
    message: 'CRUD API Example',
    endpoints: {
      list: 'GET /users',
      get: 'GET /users/:id',
      create: 'POST /users',
      update: 'PUT /users/:id',
      delete: 'DELETE /users/:id'
    }
  });
});

// Listar todos
app.get('/users', ({ res }) => {
  res.json({ users });
});

// Buscar por ID
app.get('/users/:id', ({ req, res }) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// Criar
app.post('/users', ({ req, res }) => {
  const newUser = {
    id: users.length + 1,
    ...req.body
  };
  users.push(newUser);
  res.status(201).json({ user: newUser });
});

// Atualizar
app.put('/users/:id', ({ req, res }) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  Object.assign(user, req.body);
  res.json({ user });
});

// Deletar
app.delete('/users/:id', ({ req, res }) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  const deleted = users.splice(index, 1)[0];
  res.json({ deleted });
});

app.listen(3000);

console.log('\n✅ CRUD API running at http://localhost:3000/');
console.log('\n📝 Try:');
console.log('   curl http://localhost:3000/users');
console.log('   curl http://localhost:3000/users/1');
console.log('   curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d \'{"name":"Charlie","email":"charlie@example.com"}\'');
console.log('   curl -X PUT http://localhost:3000/users/1 -H "Content-Type: application/json" -d \'{"name":"Alice Updated"}\'');
console.log('   curl -X DELETE http://localhost:3000/users/2');
