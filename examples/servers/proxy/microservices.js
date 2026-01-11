const { AzuraClient } = require('../../../package/src');

// ============================================
// MICROSSERVIÇOS
// ============================================

// Users Service (porta 4001)
const usersService = new AzuraClient();
usersService.get('/users', ({ res }) => {
  res.json({ service: 'users', data: ['Alice', 'Bob', 'Charlie'] });
});
usersService.listen(4001);

// Products Service (porta 4002)
const productsService = new AzuraClient();
productsService.get('/products', ({ res }) => {
  res.json({ service: 'products', data: ['Laptop', 'Mouse', 'Keyboard'] });
});
productsService.listen(4002);

// Orders Service (porta 4003)
const ordersService = new AzuraClient();
ordersService.get('/orders', ({ res }) => {
  res.json({ service: 'orders', data: ['Order-1', 'Order-2', 'Order-3'] });
});
ordersService.listen(4003);

// ============================================
// API GATEWAY (porta 3000)
// ============================================

const gateway = new AzuraClient();

gateway.get('/', ({ res }) => {
  res.json({
    message: 'Microservices API Gateway',
    services: {
      users: 'http://localhost:3000/users',
      products: 'http://localhost:3000/products',
      orders: 'http://localhost:3000/orders'
    }
  });
});

// Proxy para cada microsserviço
gateway.proxy('/users', 'http://localhost:4001', {
  logLevel: 'info'
});

gateway.proxy('/products', 'http://localhost:4002', {
  logLevel: 'info'
});

gateway.proxy('/orders', 'http://localhost:4003', {
  logLevel: 'info'
});

gateway.listen(3000);

console.log('\n✅ Microservices Architecture Running!');
console.log('\n📡 API Gateway: http://localhost:3000/');
console.log('   Users: http://localhost:3000/users/users');
console.log('   Products: http://localhost:3000/products/products');
console.log('   Orders: http://localhost:3000/orders/orders');
console.log('\n🔧 Direct Services:');
console.log('   Users: http://localhost:4001/users');
console.log('   Products: http://localhost:4002/products');
console.log('   Orders: http://localhost:4003/orders');
