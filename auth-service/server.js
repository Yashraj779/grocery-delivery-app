const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth", port: process.env.PORT || 5001 });
});

app.use("/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "route not found" });
});

app.use(errorHandler);

const port = Number(process.env.PORT) || 5001;

const start = async () => {
  try {
    console.log("[AUTH] Starting Auth Service...");
    await connectDB();

    app.listen(port, () => {
      console.log(`[AUTH] ✅ Auth Service running on port ${port}`);
    });
  } catch (error) {
    console.error("[AUTH] ❌ Failed to start auth service:", error.message);
    process.exit(1);
  }
};

start();
