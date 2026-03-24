# 🚀 QUICK START - RESTART AND TEST

## Step 1: Kill All Old Processes

**Option A**: Restart your computer (easiest)

**Option B**: Open Task Manager
- Press `Ctrl+Shift+Esc`
- Find all `node.exe` entries
- Right-click → "End Task" for each one
- Close Task Manager

---

## Step 2: Start Fresh Services

Open 6 terminal windows/tabs and run these commands:

### Terminal 1 - Auth Service
```powershell
cd d:\Y\grocery-app\auth-service
node server.js
```
Expected output:
```
[AUTH] Starting Auth Service...
[AUTH-DB] Connecting to MongoDB: mongodb://127.0.0.1:27017/grocery_app
[AUTH-DB] ✅ Auth Service DB connected successfully
[AUTH] ✅ Auth Service running on port 5001
```

### Terminal 2 - Product Service
```powershell
cd d:\Y\grocery-app\product-service
node server.js
```
Expected output:
```
[PRODUCT] Starting Product Service...
[PRODUCT-DB] Connecting to MongoDB: mongodb://127.0.0.1:27017/grocery_app
[PRODUCT-DB] ✅ Product Service DB connected successfully
[PRODUCT] Seeding default products...
[PRODUCT] ✅ Default products seeded
[PRODUCT] ✅ Product Service running on port 5002
```

### Terminal 3 - Cart Service
```powershell
cd d:\Y\grocery-app\cart-service
node server.js
```
Expected output:
```
[CART] Starting Cart Service...
[CART-DB] Connecting to MongoDB: mongodb://127.0.0.1:27017/grocery_app
[CART-DB] ✅ Cart Service DB connected successfully
[CART] ✅ Cart Service running on port 5003
```

### Terminal 4 - Order Service
```powershell
cd d:\Y\grocery-app\order-service
node server.js
```
Expected output:
```
[ORDER] Starting Order Service...
[ORDER-DB] Connecting to MongoDB: mongodb://127.0.0.1:27017/grocery_app
[ORDER-DB] ✅ Order Service DB connected successfully
[ORDER] ✅ Order Service running on port 5004
```

### Terminal 5 - Delivery Service
```powershell
cd d:\Y\grocery-app\delivery-service
node server.js
```
Expected output:
```
[DELIVERY] Starting Delivery Service...
[DELIVERY-DB] Connecting to MongoDB: mongodb://127.0.0.1:27017/grocery_app
[DELIVERY-DB] ✅ Delivery Service DB connected successfully
[DELIVERY] ✅ Delivery Service running on port 5005
```

### Terminal 6 - API Gateway
```powershell
cd d:\Y\grocery-app\api-gateway
node server.js
```
Expected output:
```
API Gateway running on port 5000
```

---

## Step 3: Run Tests

Once all 6 services show "running on port", open a 7th terminal:

```powershell
cd d:\Y\grocery-app
node e2e-test.js
```

**Expected output:**
```
======================================================================
  COMPREHENSIVE E2E TEST - GROCERY DELIVERY MICROSERVICES
======================================================================

📊 STEP 1: Service Health Checks

[HH:MM:SS] [✅] [Auth] Service online on port 5001
[HH:MM:SS] [✅] [Product] Service online on port 5002
[HH:MM:SS] [✅] [Cart] Service online on port 5003
[HH:MM:SS] [✅] [Order] Service online on port 5004
[HH:MM:SS] [✅] [Delivery] Service online on port 5005
[HH:MM:SS] [✅] [Gateway] Service online on port 5000

... [more test output] ...

======================================================================
  TEST RESULTS: 18 PASSED | 0 FAILED
======================================================================

✅ ALL TESTS PASSED! Your microservices are working correctly.
```

---

## Step 4: Verify Data in MongoDB Compass

Open MongoDB Compass and look at `localhost:27017 > grocery_app`:

You should see 5 collections with data:
- ✅ `users` - Contains the test user account
- ✅ `products` - Contains 6 default products
- ✅ `carts` - Contains shopping cart items
- ✅ `orders` - Contains created orders
- ✅ `deliveries` - Contains delivery tracking

---

## What Changed?

### ✅ All Services Now Have:
1. **Health check endpoints** - `GET /health` on each service
2. **Detailed logging** - Every operation logs with `[SERVICE-NAME]` prefix
3. **MongoDB persistence** - All data saves to database
4. **Error logging** - Actual error messages returned to frontend
5. **Startup logs** - Clear indication of DB connection status

### ✅ Services Affected:
- auth-service (Port 5001)
- product-service (Port 5002)
- cart-service (Port 5003)
- order-service (Port 5004)
- delivery-service (Port 5005)
- api-gateway (Port 5000)

### ✅ New Test Files:
- `e2e-test.js` - Comprehensive test suite
- `start-all-services.js` - One-click service starter script

---

## Troubleshooting

### If a service won't start:
1. Check MongoDB is running (`mongod` or MongoDB service)
2. Check the .env file has correct `MONGO_URI=mongodb://127.0.0.1:27017/grocery_app`
3. Check no other process is using the port
4. Look at the error message in the terminal - it will now be descriptive!

### If tests fail:
1. Make sure all 6 services are running (check all 6 terminals)
2. Wait 5 seconds after starting all services before running tests
3. Check the detailed error messages in the test output

### If MongoDB data isn't showing:
1. Check all services connected successfully (look for `✅ DB connected` in logs)
2. Run the tests (they create data in MongoDB)
3. Refresh MongoDB Compass

---

## Next Steps

After verification, you can:
1. ✅ Start building your Frontend to use the APIs
2. ✅ Add more products via POST /products
3. ✅ Create users and test full flow
4. ✅ Deploy to production with proper error handling

All data will now persist properly in MongoDB!

---

This quick-start guide is now the single source of truth for restart and validation steps.
