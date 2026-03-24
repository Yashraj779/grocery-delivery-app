#!/usr/bin/env node
/**
 * Comprehensive End-to-End Test for Grocery Delivery Microservices
 * Tests all services and MongoDB persistence
 */

const http = require('http');

const request = (method, host, port, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const log = (level, service, message) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] [${level}] [${service}] ${message}`);
};

const main = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('  COMPREHENSIVE E2E TEST - GROCERY DELIVERY MICROSERVICES');
  console.log('='.repeat(70) + '\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // ===== 1. HEALTH CHECKS =====
  console.log('📊 STEP 1: Service Health Checks\n');
  
  const services = [
    { name: 'Auth', port: 5001 },
    { name: 'Product', port: 5002 },
    { name: 'Cart', port: 5003 },
    { name: 'Order', port: 5004 },
    { name: 'Delivery', port: 5005 },
    { name: 'Gateway', port: 5000 },
  ];

  for (const service of services) {
    try {
      const res = await request('GET', 'localhost', service.port, '/health');
      if (res.status === 200) {
        log('✅', service.name, `Service online on port ${service.port}`);
        testsPassed++;
      } else {
        log('❌', service.name, `Unexpected status: ${res.status}`);
        testsFailed++;
      }
    } catch (e) {
      log('❌', service.name, `Failed to connect: ${e.message}`);
      testsFailed++;
    }
  }

  // ===== 2. AUTH SERVICE =====
  console.log('\n👤 STEP 2: Authentication Service Tests\n');

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let authToken = null;
  let testUserId = null;

  // Register
  try {
    const res = await request('POST', 'localhost', 5001, '/auth/register', {
      name: 'Test User',
      email: testEmail,
      password: testPassword,
    });
    if (res.status === 201) {
      log('✅', 'Auth', `User registered: ${testEmail}`);
      testsPassed++;
    } else {
      log('❌', 'Auth', `Register failed: ${res.status}`);
      testsFailed++;
    }
  } catch (e) {
    log('❌', 'Auth', `Register error: ${e.message}`);
    testsFailed++;
  }

  // Login
  try {
    const res = await request('POST', 'localhost', 5001, '/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    if (res.status === 200 && res.data.token && res.data.user) {
      authToken = res.data.token;
      testUserId = res.data.user.id;
      log('✅', 'Auth', `User logged in successfully, token: ${authToken.substring(0, 20)}...`);
      testsPassed++;
    } else {
      log('❌', 'Auth', `Login failed: ${res.status}`);
      testsFailed++;
    }
  } catch (e) {
    log('❌', 'Auth', `Login error: ${e.message}`);
    testsFailed++;
  }

  // ===== 3. PRODUCT SERVICE =====
  console.log('\n📦 STEP 3: Product Service Tests\n');

  // Get products
  try {
    const res = await request('GET', 'localhost', 5002, '/products');
    if (res.status === 200 && Array.isArray(res.data)) {
      log('✅', 'Product', `Retrieved ${res.data.length} products from database`);
      testsPassed++;
    } else {
      log('❌', 'Product', `GET /products failed: ${res.status}`);
      testsFailed++;
    }
  } catch (e) {
    log('❌', 'Product', `Fetch products error: ${e.message}`);
    testsFailed++;
  }

  // Create product
  const newProductName = `Test Product ${Date.now()}`;
  try {
    const res = await request('POST', 'localhost', 5002, '/products', {
      name: newProductName,
      price: 99.99,
      image: '/test-image.png',
      category: 'Test',
    });
    if (res.status === 201 && res.data._id) {
      log('✅', 'Product', `New product created: ${newProductName}`);
      testsPassed++;
    } else {
      log('❌', 'Product', `POST /products failed: ${res.status}`);
      testsFailed++;
    }
  } catch (e) {
    log('❌', 'Product', `Create product error: ${e.message}`);
    testsFailed++;
  }

  // ===== 4. CART SERVICE =====
  console.log('\n🛒 STEP 4: Cart Service Tests\n');

  const userId = testUserId || 'test-user-' + Date.now();

  // Add item to cart
  try {
    const res = await request('POST', 'localhost', 5003, '/add', {
      id: 1,
      name: 'Tomato',
      price: 30,
      image: '/tomato.png',
      userId,
    });
    if (res.status === 200) {
      log('✅', 'Cart', `Item added to cart for user: ${userId}`);
      testsPassed++;
    } else {
      log('❌', 'Cart', `Add item failed: ${res.status}`);
      log('   Error:', res.data.error || res.data.message);
      testsFailed++;
    }
  } catch (e) {
    log('❌', 'Cart', `Add item error: ${e.message}`);
    testsFailed++;
  }

  // Get cart
  try {
    const res = await request('GET', 'localhost', 5003, `/cart/${userId}`);
    if (res.status === 200 && res.data.userId === userId) {
      log('✅', 'Cart', `Cart retrieved for user ${userId} with ${res.data.items?.length || 0} items`);
      testsPassed++;
    } else {
      log('❌', 'Cart', `GET /cart/:userId failed: ${res.status}`);
      testsFailed++;
    }
  } catch (e) {
    log('❌', 'Cart', `Get cart error: ${e.message}`);
    testsFailed++;
  }

  // ===== 5. ORDER SERVICE =====
  console.log('\n📋 STEP 5: Order Service Tests\n');

  let orderId = null;

  // Create order
  try {
    const res = await request('POST', 'localhost', 5004, '/order', {
      userId,
      items: [
        { productId: 1, quantity: 2, name: 'Tomato', price: 30 },
        { productId: 2, quantity: 1, name: 'Milk', price: 50 },
      ],
      totalAmount: 110,
    });
    if (res.status === 201 && typeof res.data.orderId === 'number') {
      orderId = res.data.orderId;
      log('✅', 'Order', `Order created - ID: ${orderId}, User: ${userId}, Total: ₹110`);
      testsPassed++;
    } else {
      log('❌', 'Order', `POST /order failed: ${res.status}`);
      log('   Error:', res.data.error || res.data.message);
      testsFailed++;
    }
  } catch (e) {
    log('❌', 'Order', `Create order error: ${e.message}`);
    testsFailed++;
  }

  // Get user orders
  try {
    const res = await request('GET', 'localhost', 5004, `/orders/${userId}`);
    if (res.status === 200 && Array.isArray(res.data)) {
      log('✅', 'Order', `Retrieved ${res.data.length} orders for user ${userId}`);
      testsPassed++;
    } else {
      log('❌', 'Order', `GET /orders/:userId failed: ${res.status}`);
      testsFailed++;
    }
  } catch (e) {
    log('❌', 'Order', `Get orders error: ${e.message}`);
    testsFailed++;
  }

  // ===== 6. DELIVERY SERVICE =====
  console.log('\n🚗 STEP 6: Delivery Service Tests\n');

  if (orderId) {
    // Start delivery
    try {
      const res = await request('POST', 'localhost', 5005, '/start', { orderId });
      if (res.status === 200 && res.data.status === 'Preparing') {
        log('✅', 'Delivery', `Delivery started for order ${orderId}`);
        testsPassed++;
      } else {
        log('❌', 'Delivery', `POST /start failed: ${res.status}`);
        testsFailed++;
      }
    } catch (e) {
      log('❌', 'Delivery', `Start delivery error: ${e.message}`);
      testsFailed++;
    }

    // Get delivery status
    try {
      const res = await request('GET', 'localhost', 5005, `/status/${orderId}`);
      if (res.status === 200 && res.data.orderId === orderId) {
        log('✅', 'Delivery', `Status retrieved for order ${orderId}: ${res.data.status}`);
        testsPassed++;
      } else {
        log('❌', 'Delivery', `GET /status/:orderId failed: ${res.status}`);
        testsFailed++;
      }
    } catch (e) {
      log('❌', 'Delivery', `Get status error: ${e.message}`);
      testsFailed++;
    }

    // Update delivery status
    try {
      const res = await request('POST', 'localhost', 5005, '/update', { orderId });
      if (res.status === 200) {
        log('✅', 'Delivery', `Status updated to: ${res.data.status}`);
        testsPassed++;
      } else {
        log('❌', 'Delivery', `POST /update failed: ${res.status}`);
        testsFailed++;
      }
    } catch (e) {
      log('❌', 'Delivery', `Update status error: ${e.message}`);
      testsFailed++;
    }
  }

  // ===== 7. SUMMARY =====
  console.log('\n' + '='.repeat(70));
  console.log(`  TEST RESULTS: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log('='.repeat(70) + '\n');

  if (testsFailed === 0) {
    console.log('✅ ALL TESTS PASSED! Your microservices are working correctly.\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${testsFailed} tests failed. Check the logs above for details.\n`);
    process.exit(1);
  }
};

main().catch((e) => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
