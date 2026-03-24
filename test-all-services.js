#!/usr/bin/env node
const http = require('http');

const test = (method, host, port, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const main = async () => {
  console.log('\n=== COMPREHENSIVE SERVICE TEST ===\n');

  try {
    // 1. Test Auth Service
    console.log('1️⃣  AUTH SERVICE (Port 5001)');
    try {
      const reg = await test('POST', 'localhost', 5001, '/auth/register', {
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'test123456',
      });
      console.log(`   ✅ Register: ${reg.status} -`, reg.data.message || reg.data);
    } catch (e) {
      console.log(`   ❌ Register failed:`, e.message);
    }

    // 2. Test Product Service
    console.log('\n2️⃣  PRODUCT SERVICE (Port 5002)');
    try {
      const prods = await test('GET', 'localhost', 5002, '/products');
      console.log(`   ✅ GET /products: ${prods.status} - ${Array.isArray(prods.data) ? prods.data.length : 'invalid'} products`);
    } catch (e) {
      console.log(`   ❌ GET /products failed:`, e.message);
    }

    // 3. Test Cart Service
    console.log('\n3️⃣  CART SERVICE (Port 5003)');
    try {
      const cart = await test('GET', 'localhost', 5003, '/cart/guest-user');
      console.log(`   ✅ GET /cart/guest-user: ${cart.status} -`, Array.isArray(cart.data?.items) ? 'items' : cart.data);
    } catch (e) {
      console.log(`   ❌ Cart service failed:`, e.message);
    }

    // 4. Test Order Service
    console.log('\n4️⃣  ORDER SERVICE (Port 5004)');
    try {
      const orders = await test('GET', 'localhost', 5004, '/orders/guest-user');
      console.log(`   ✅ GET /orders/guest-user: ${orders.status} - ${Array.isArray(orders.data) ? orders.data.length : 'invalid'} orders`);
    } catch (e) {
      console.log(`   ❌ Order service failed:`, e.message);
    }

    // 5. Test Delivery Service
    console.log('\n5️⃣  DELIVERY SERVICE (Port 5005)');
    try {
      const deliv = await test('GET', 'localhost', 5005, '/status/1');
      console.log(`   ✅ GET /status/1: ${deliv.status}`);
    } catch (e) {
      console.log(`   ❌ Delivery service failed:`, e.message);
    }

    // 6. Test API Gateway
    console.log('\n6️⃣  API GATEWAY (Port 5000)');
    try {
      const reg2 = await test('POST', 'localhost', 5000, '/auth/register', {
        name: 'Gateway Test User',
        email: `gw_${Date.now()}@example.com`,
        password: 'test123456',
      });
      console.log(`   ✅ Gateway /auth/register: ${reg2.status}`);
    } catch (e) {
      console.log(`   ❌ API Gateway failed:`, e.message);
    }

    console.log('\n✅ Diagnostic test complete\n');
  } catch (e) {
    console.error('Test error:', e.message);
    process.exit(1);
  }
};

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
