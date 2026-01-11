const { AzuraClient } = require('../../../package/src');

const app = new AzuraClient();

// Rota principal
app.get('/', ({ res }) => {
  res.json({
    message: 'Cookie Example',
    routes: {
      set: '/set-cookie',
      get: '/get-cookie',
      clear: '/clear-cookie'
    }
  });
});

// Definir cookie
app.get('/set-cookie', ({ res }) => {
  res.cookie('username', 'john_doe', {
    httpOnly: true,
    maxAge: 3600000, // 1 hora
    path: '/'
  });
  res.json({ message: 'Cookie set!' });
});

// Ler cookie
app.get('/get-cookie', ({ req, res }) => {
  const username = req.cookies.username;
  res.json({ 
    username: username || 'No cookie found',
    allCookies: req.cookies
  });
});

// Limpar cookie
app.get('/clear-cookie', ({ res }) => {
  res.clearCookie('username');
  res.json({ message: 'Cookie cleared!' });
});

app.listen(3000);

console.log('\n✅ Cookie example running!');
console.log('   Set: http://localhost:3000/set-cookie');
console.log('   Get: http://localhost:3000/get-cookie');
console.log('   Clear: http://localhost:3000/clear-cookie');
