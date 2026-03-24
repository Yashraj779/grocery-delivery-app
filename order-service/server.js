const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const express = require("express");
const connectDB = require("./config/db");
const Order = require("./models/Order");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "order", port: process.env.PORT || 5004 });
});

const DEFAULT_USER_ID = "guest-user";

const nextOrderId = async () => {
  const latestOrder = await Order.findOne({}).sort({ orderId: -1 }).select({ orderId: 1 }).lean();
  return latestOrder?.orderId ? latestOrder.orderId + 1 : 1;
};

app.post("/order", async (req, res) => {
  try {
    const userId = typeof req.body?.userId === "string" && req.body.userId.trim()
      ? req.body.userId.trim()
      : DEFAULT_USER_ID;

    const inputItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const items = inputItems
      .map((item) => ({
        productId: Number(item.productId || item.id),
        quantity: Math.max(1, Number(item.quantity) || 1),
        name: typeof item.name === "string" ? item.name : "",
        price: Number(item.price) || 0,
        image: typeof item.image === "string" ? item.image : "",
      }))
      .filter((item) => Number.isFinite(item.productId));

    const totalAmount =
      typeof req.body?.totalAmount === "number"
        ? req.body.totalAmount
        : items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderId = await nextOrderId();
    const newOrder = await Order.create({
      orderId,
      userId,
      items,
      totalAmount,
      status: "placed",
    });
    console.log(`[ORDER] Order created - orderId: ${orderId}, userId: ${userId}, totalAmount: ${totalAmount}`);
    return res.status(201).json({
      success: true,
      message: "Order placed",
      orderId,
      status: "Preparing",
    });
  } catch (error) {
    console.error(`[ORDER] Order creation error:`, error.message);
    return res.status(500).json({ message: "Failed to place order", error: error.message });
  }
});

app.get("/orders/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    console.log(`[ORDER] Orders fetched for user ${userId} - ${orders.length} found`);
    return res.status(200).json(orders);
  } catch (error) {
    console.error(`[ORDER] Fetch orders error:`, error.message);
    return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
});

const start = async () => {
  try {
    console.log("[ORDER] Starting Order Service...");
    await connectDB();
    const port = Number(process.env.PORT) || 5004;
    app.listen(port, () => console.log(`[ORDER] ✅ Order Service running on port ${port}`));
  } catch (error) {
    console.error("[ORDER] ❌ Failed to start order-service:", error.message);
    process.exit(1);
  }
};

start();