#!/usr/bin/env node
// Comprehensive service diagnostic tool

const http = require('http');

const SERVICES = {
  Auth: { port: 5001 },
  Product: { port: 5002 },
  Cart: { port: 5003 },
  Order: { port: 5004 },
  Delivery: { port: 5005 },
  Gateway: { port: 5000 },
};

const testService = (name, port) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port,
      path: '/health',
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ name, port, status: res.statusCode, online: res.statusCode === 200, data });
      });
    });

    req.on('error', (err) => {
      resolve({ name, port, status: 'ERROR', online: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ name, port, status: 'TIMEOUT', online: false, error: 'Request timeout' });
    });

    req.end();
  });
};

const main = async () => {
  console.log('=== Service Diagnostic Report ===\n');
  
  const results = await Promise.all(
    Object.entries(SERVICES).map(([name, config]) => testService(name, config.port))
  );

  results.forEach((result) => {
    const status = result.online ? '✅' : '❌';
    console.log(`${status} ${result.name.padEnd(15)} Port:${result.port} - ${result.status === 200 ? 'Online' : result.status}`);
    if (result.error) console.log(`   Error: ${result.error}`);
  });

  const allOnline = results.every(r => r.online);
  console.log(`\n${allOnline ? '✅ All services online!' : '❌ Some services are offline'}`);
  
  process.exit(allOnline ? 0 : 1);
};

main();
