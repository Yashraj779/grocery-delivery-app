const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const express = require("express");
const connectDB = require("./config/db");
const Cart = require("./models/Cart");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "cart", port: process.env.PORT || 5003 });
});

const DEFAULT_USER_ID = "guest-user";

const resolveUserId = (req) => {
  const bodyUserId = typeof req.body?.userId === "string" ? req.body.userId.trim() : "";
  const queryUserId = typeof req.query?.userId === "string" ? req.query.userId.trim() : "";
  return bodyUserId || queryUserId || DEFAULT_USER_ID;
};

const toLegacyItems = (items) =>
  items.map((item) => ({
    id: item.productId,
    quantity: item.quantity,
    name: item.name || "",
    price: item.price || 0,
    image: item.image || "",
  }));

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

app.post("/cart", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { items } = req.body || {};

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "items array is required" });
    }

    const normalizedItems = items
      .map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity) || 1,
      }))
      .filter((item) => Number.isFinite(item.productId) && item.quantity > 0);

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: normalizedItems } },
      { new: true, upsert: true },
    );

    console.log(`[CART] Cart updated for user ${userId} with ${normalizedItems.length} items`);
    return res.status(200).json(cart);
  } catch (error) {
    console.error(`[CART] Cart POST error:`, error.message);
    return res.status(500).json({ message: "Failed to save cart", error: error.message });
  }
});

app.get("/cart/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const cart = await getOrCreateCart(userId);
    console.log(`[CART] Cart fetched for user ${userId} with ${cart.items.length} items`);
    return res.status(200).json(cart);
  } catch (error) {
    console.error(`[CART] GET userId error:`, error.message);
    return res.status(500).json({ message: "Failed to fetch cart", error: error.message });
  }
});

app.post("/add", async (req, res) => {
  try {
    if (typeof req.body?.id !== "number") {
      return res.status(400).json({ message: "Invalid product" });
    }

    const userId = resolveUserId(req);
    const cart = await getOrCreateCart(userId);
    const existing = cart.items.find((item) => item.productId === req.body.id);

    if (existing) {
      existing.quantity += 1;
      existing.name = req.body.name || existing.name;
      existing.price = Number(req.body.price) || existing.price;
      existing.image = req.body.image || existing.image;
    } else {
      cart.items.push({
        productId: req.body.id,
        quantity: 1,
        name: req.body.name || "",
        price: Number(req.body.price) || 0,
        image: req.body.image || "",
      });
    }

    await cart.save();
    console.log(`[CART] Item added to user ${userId}`);
    return res.status(200).json({ message: "Item added", cart: toLegacyItems(cart.items) });
  } catch (error) {
    console.error(`[CART] Add item error:`, error.message);
    return res.status(500).json({ message: "Failed to add item", error: error.message });
  }
});

app.post("/update", async (req, res) => {
  try {
    if (typeof req.body?.productId !== "number") {
      return res.status(400).json({ message: "productId required" });
    }

    if (!["increment", "decrement"].includes(req.body.operation)) {
      return res.status(400).json({ message: "Invalid operation" });
    }

    const userId = resolveUserId(req);
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((entry) => entry.productId === req.body.productId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (req.body.operation === "increment") {
      item.quantity += 1;
    } else if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      cart.items = cart.items.filter((entry) => entry.productId !== req.body.productId);
    }

    await cart.save();
    console.log(`[CART] Item updated in user ${userId}`);
    return res.status(200).json({ message: "Updated", cart: toLegacyItems(cart.items) });
  } catch (error) {
    console.error(`[CART] Update error:`, error.message);
    return res.status(500).json({ message: "Failed to update cart", error: error.message });
  }
});

app.post("/remove", async (req, res) => {
  try {
    if (typeof req.body?.productId !== "number") {
      return res.status(400).json({ message: "productId required" });
    }

    const userId = resolveUserId(req);
    const cart = await getOrCreateCart(userId);
    cart.items = cart.items.filter((item) => item.productId !== req.body.productId);
    await cart.save();
    console.log(`[CART] Item removed from user ${userId}`);
    return res.status(200).json({ message: "Removed", cart: toLegacyItems(cart.items) });
  } catch (error) {
    console.error(`[CART] Remove error:`, error.message);
    return res.status(500).json({ message: "Failed to remove item", error: error.message });
  }
});

app.delete("/clear", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const cart = await getOrCreateCart(userId);
    cart.items = [];
    await cart.save();
    console.log(`[CART] Cart cleared for user ${userId}`);
    return res.status(200).json({ message: "Cleared", cart: [] });
  } catch (error) {
    console.error(`[CART] Clear error:`, error.message);
    return res.status(500).json({ message: "Failed to clear cart", error: error.message });
  }
});

app.get("/cart", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const cart = await getOrCreateCart(userId);
    console.log(`[CART] Cart fetched for user ${userId}`);
    return res.status(200).json(toLegacyItems(cart.items));
  } catch (error) {
    console.error(`[CART] Fetch error:`, error.message);
    return res.status(500).json({ message: "Failed to fetch cart", error: error.message });
  }
});

const start = async () => {
  try {
    console.log("[CART] Starting Cart Service...");
    await connectDB();
    const port = Number(process.env.PORT) || 5003;
    app.listen(port, () => {
      console.log(`[CART] ✅ Cart Service running on port ${port}`);
    });
  } catch (error) {
    console.error("[CART] ❌ Failed to start cart-service:", error.message);
    process.exit(1);
  }
};

start();