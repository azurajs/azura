const { AzuraClient } = require('../../../package/src');

const app = new AzuraClient();

// Rota principal
app.get('/', ({ res }) => {
  res.json({
    message: 'Plugins Example - CORS & Rate Limit enabled',
    info: 'Try making multiple requests quickly to see rate limiting'
  });
});

// Rota de teste
app.get('/test', ({ res }) => {
  res.json({ 
    timestamp: new Date().toISOString(),
    message: 'This request counts towards your rate limit'
  });
});

app.listen(3000);

console.log('\n✅ Server with plugins running!');
console.log('   http://localhost:3000/');
console.log('   http://localhost:3000/test');
console.log('\n💡 Plugins are configured in azura.config.ts');
console.log('   - CORS: Enabled');
console.log('   - Rate Limit: Check config file');
