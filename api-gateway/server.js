const cors = require("cors");
const express = require("express");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const URLS = {
  AUTH: "http://localhost:5001",
  PRODUCT: "http://localhost:5002",
  CART: "http://localhost:5003",
  ORDER: "http://localhost:5004",
  DELIVERY: "http://localhost:5005",
  NOTIFICATION: "http://localhost:5006",
};

const proxy = (path, method = "GET", transform = (d) => d) => async (req, res) => {
  try {
    const config = { method, url: path };
    if (["POST", "PUT"].includes(method)) config.data = req.body;
    const response = await axios(config);
    res.status(response.status).json(transform(response.data));
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json(error.response?.data || { message: "Service unavailable" });
  }
};

app.get("/products", proxy(URLS.PRODUCT + "/products", "GET", (d) => (Array.isArray(d) ? d : [])));
app.post("/products", proxy(URLS.PRODUCT + "/products", "POST"));
app.post("/auth/register", proxy(URLS.AUTH + "/auth/register", "POST"));
app.post("/auth/login", proxy(URLS.AUTH + "/auth/login", "POST"));
app.get("/cart", proxy(URLS.CART + "/cart", "GET", (d) => (Array.isArray(d) ? d : [])));
app.get("/cart/:userId", (req, res) => proxy(URLS.CART + `/cart/${req.params.userId}`, "GET")(req, res));
app.post("/cart", proxy(URLS.CART + "/add", "POST"));
app.post("/cart/update", proxy(URLS.CART + "/update", "POST"));
app.post("/cart/remove", proxy(URLS.CART + "/remove", "POST"));
app.delete("/cart", proxy(URLS.CART + "/clear", "DELETE"));
app.get("/orders/:userId", (req, res) => proxy(URLS.ORDER + `/orders/${req.params.userId}`, "GET")(req, res));

app.post("/order", async (req, res) => {
  try {
    const cartRes = await axios.get(URLS.CART + "/cart");
    const cartItems = Array.isArray(cartRes.data) ? cartRes.data : [];
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0,
    );

    const orderRes = await axios.post(URLS.ORDER + "/order", {
      userId: req.body?.userId || "guest-user",
      items: cartItems,
      totalAmount,
    });
    const { orderId, status } = orderRes.data;
    if (typeof orderId !== "number" || typeof status !== "string") throw new Error("Invalid response");

    const deliveryRes = await axios.post(URLS.DELIVERY + "/start", { orderId });
    await axios.post(URLS.NOTIFICATION + "/notify", { message: `Order #${orderId} placed!` });
    await axios.delete(URLS.CART + "/clear");

    res.json({
      success: true,
      message: "Order placed successfully",
      orderId,
      status,
      delivery: deliveryRes.data,
    });
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json(error.response?.data || { message: "Service unavailable" });
  }
});

app.get("/delivery", (req, res) => {
  const orderId = Number(req.query.orderId);
  if (Number.isNaN(orderId)) return res.status(400).json({ message: "orderId required" });
  proxy(URLS.DELIVERY + `/status/${orderId}`)(req, res);
});

app.post("/delivery/update", async (req, res) => {
  const { orderId } = req.body;
  if (typeof orderId !== "number") return res.status(400).json({ message: "orderId required" });

  try {
    const response = await axios.post(URLS.DELIVERY + "/update", { orderId });
    await axios.post(URLS.NOTIFICATION + "/notify", {
      message: `Order #${orderId} status: ${response.data.status}`,
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json(error.response?.data || { message: "Service unavailable" });
  }
});

app.listen(5000, () => console.log("API Gateway running on port 5000"));
