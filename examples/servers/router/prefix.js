const { AzuraClient, Router } = require('../../../package/src');

// ============================================
// ROUTERS MODULARES
// ============================================

// Router para páginas "About"
const aboutRouter = new Router();

aboutRouter.add('GET', '/', ({ req, res }) => {
  res.end('About Home');
});

aboutRouter.add('GET', '/team', ({ req, res }) => {
  res.end('Our Team: Alice, Bob, Charlie');
});

aboutRouter.add('GET', '/contact', ({ req, res }) => {
  res.end('Contact: email@example.com');
});

// Router para API
const apiRouter = new Router();

apiRouter.add('GET', '/', ({ req, res }) => {
  res.json({ message: 'API Home', version: '1.0.0' });
});

apiRouter.add('GET', '/users', ({ req, res }) => {
  res.json({ users: ['Alice', 'Bob', 'Charlie'] });
});

apiRouter.add('POST', '/users', ({ req, res }) => {
  res.json({ message: 'User created', body: req.body });
});

// ============================================
// APP PRINCIPAL
// ============================================

const app = new AzuraClient();

// Rota principal
app.get('/', ({ res }) => {
  res.json({
    message: 'Router Prefix Example',
    routes: {
      about: 'http://localhost:3000/about',
      aboutTeam: 'http://localhost:3000/about/team',
      api: 'http://localhost:3000/api',
      apiUsers: 'http://localhost:3000/api/users'
    }
  });
});

// Montar routers com prefixos
app.use('/about', aboutRouter);
app.use('/api', apiRouter);

app.listen(3000);

console.log('\n✅ Server running!');
console.log('\n📋 Routes:');
console.log('   Main: http://localhost:3000/');
console.log('   About: http://localhost:3000/about');
console.log('   Team: http://localhost:3000/about/team');
console.log('   Contact: http://localhost:3000/about/contact');
console.log('   API: http://localhost:3000/api');
console.log('   Users: http://localhost:3000/api/users');
