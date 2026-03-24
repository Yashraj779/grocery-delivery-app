#!/usr/bin/env node
/**
 * Start all microservices
 */

const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'Auth', path: 'auth-service', port: 5001 },
  { name: 'Product', path: 'product-service', port: 5002 },
  { name: 'Cart', path: 'cart-service', port: 5003 },
  { name: 'Order', path: 'order-service', port: 5004 },
  { name: 'Delivery', path: 'delivery-service', port: 5005 },
  { name: 'Gateway', path: 'api-gateway', port: 5000 },
];

const processes = [];

console.log('\n🚀 Starting all microservices...\n');

services.forEach((service) => {
  const servicePath = path.join(__dirname, service.path);
  const proc = spawn('node', [path.join(servicePath, 'server.js')], {
    cwd: servicePath,
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  processes.push(proc);
  console.log(`✅ Started ${service.name} Service (Port ${service.port})`);
});

console.log('\n✅ All services starting. Please wait 5 seconds for initialization...\n');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping all services...');
  processes.forEach((proc) => proc.kill());
  process.exit(0);
});
