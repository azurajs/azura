const { AzuraClient } = require('../../../package/src');

const app = new AzuraClient();

// Rota principal
app.get('/', ({ res }) => {
  res.json({ message: 'Error Handling Example' });
});

// Erro customizado
app.get('/error', ({ res }) => {
  throw new Error('This is a custom error!');
});

// 404 personalizado
app.get('/not-found', ({ res }) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'This resource does not exist'
  });
});

// Validação com erro
app.post('/validate', ({ req, res }) => {
  if (!req.body.email) {
    return res.status(400).json({ 
      error: 'Validation Error',
      message: 'Email is required'
    });
  }
  res.json({ message: 'Valid!', email: req.body.email });
});

app.listen(3000);

console.log('\n✅ Error handling example!');
console.log('   Normal: http://localhost:3000/');
console.log('   Error: http://localhost:3000/error');
console.log('   404: http://localhost:3000/not-found');
console.log('   Validation: curl -X POST http://localhost:3000/validate -H "Content-Type: application/json" -d \'{}\'');
