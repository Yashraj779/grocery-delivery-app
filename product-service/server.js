const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const express = require("express");
const connectDB = require("./config/db");
const Product = require("./models/Product");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "product", port: process.env.PORT || 5002 });
});

const defaultProducts = [
  { name: "Tomato", price: 30, category: "Vegetables", image: "/product-images/tomato.png" },
  { name: "Milk", price: 50, category: "Dairy", image: "/product-images/milk.png" },
  { name: "Rice", price: 80, category: "Grains", image: "/product-images/rice.png" },
  { name: "Banana", price: 45, category: "Fruits", image: "/product-images/banana.png" },
  { name: "Bread", price: 40, category: "Bakery", image: "/product-images/bread.png" },
  { name: "Spinach", price: 35, category: "Vegetables", image: "/product-images/spinach.png" },
];

const sanitizeProduct = (doc, index) => ({
  id: index + 1,
  name: doc.name,
  price: doc.price,
  category: doc.category,
  image: doc.image,
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: 1 });
    console.log(`[PRODUCT] Products fetched - ${products.length} total`);
    return res.status(200).json(products.map((product, index) => sanitizeProduct(product, index)));
  } catch (error) {
    console.error(`[PRODUCT] Fetch error:`, error.message);
    return res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
});

app.post("/products", async (req, res) => {
  try {
    const { name, price, image, category } = req.body || {};

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "name is required" });
    }

    if (typeof price !== "number" || Number.isNaN(price) || price < 0) {
      return res.status(400).json({ message: "valid price is required" });
    }

    if (!image || typeof image !== "string") {
      return res.status(400).json({ message: "image is required" });
    }

    if (!category || typeof category !== "string") {
      return res.status(400).json({ message: "category is required" });
    }

    const product = await Product.create({
      name: name.trim(),
      price,
      image: image.trim(),
      category: category.trim(),
    });

    console.log(`[PRODUCT] Product created - name: ${product.name}, id: ${product._id}`);
    return res.status(201).json(product);
  } catch (error) {
    console.error(`[PRODUCT] Create error:`, error.message);
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
});

const start = async () => {
  try {
    console.log("[PRODUCT] Starting Product Service...");
    await connectDB();

    const existingCount = await Product.countDocuments();
    if (!existingCount) {
      console.log("[PRODUCT] Seeding default products...");
      await Product.insertMany(defaultProducts);
      console.log("[PRODUCT] ✅ Default products seeded");
    }

    const port = Number(process.env.PORT) || 5002;
    app.listen(port, () => console.log(`[PRODUCT] ✅ Product Service running on port ${port}`));
  } catch (error) {
    console.error("[PRODUCT] ❌ Failed to start product-service:", error.message);
    process.exit(1);
  }
};

start();