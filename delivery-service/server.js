const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const express = require("express");
const connectDB = require("./config/db");
const Delivery = require("./models/Delivery");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "delivery", port: process.env.PORT || 5005 });
});

const STAGES = ["Preparing", "Packed", "Out for Delivery", "Delivered"];

app.post("/delivery", async (req, res) => {
  try {
    const { orderId, status } = req.body || {};
    if (typeof orderId !== "number") {
      return res.status(400).json({ message: "orderId required" });
    }

    if (!status || !STAGES.includes(status)) {
      return res.status(400).json({ message: "valid status is required" });
    }

    const delivery = await Delivery.findOneAndUpdate(
      { orderId },
      { $set: { status, updatedAt: new Date() } },
      { new: true, upsert: true },
    );
    console.log(`[DELIVERY] Status updated - orderId: ${orderId}, status: ${status}`);
    return res.status(200).json(delivery);
  } catch (error) {
    console.error(`[DELIVERY] Update error:`, error.message);
    return res.status(500).json({ message: "Failed to update delivery", error: error.message });
  }
});

app.post("/start", async (req, res) => {
  try {
    if (typeof req.body?.orderId !== "number") {
      return res.status(400).json({ message: "orderId required" });
    }

    const orderId = req.body.orderId;
    const delivery = await Delivery.findOneAndUpdate(
      { orderId },
      { $set: { status: STAGES[0], updatedAt: new Date() } },
      { new: true, upsert: true },
    );
   console.log(`[DELIVERY] Delivery started - orderId: ${orderId}, status: ${STAGES[0]}`);
    return res.status(200).json({ orderId, status: delivery.status, timeline: STAGES });
  } catch (error) {
    console.error(`[DELIVERY] Start error:`, error.message);
    return res.status(500).json({ message: "Failed to start delivery", error: error.message });
  }
});

app.get("/status/:orderId", async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    const delivery = await Delivery.findOne({ orderId }).lean();
    if (!delivery) {
      return res.status(404).json({ message: "Not found" });
    }

    console.log(`[DELIVERY] Status fetched - orderId: ${orderId}, status: ${delivery.status}`);
    return res.status(200).json({ orderId, status: delivery.status, timeline: STAGES });
  } catch (error) {
    console.error(`[DELIVERY] Status fetch error:`, error.message);
    return res.status(500).json({ message: "Failed to fetch delivery status", error: error.message });
  }
});

app.post("/update", async (req, res) => {
  try {
    if (typeof req.body?.orderId !== "number") {
      return res.status(400).json({ message: "orderId required" });
    }

    const orderId = req.body.orderId;
    const delivery = await Delivery.findOne({ orderId });
    if (!delivery) {
      return res.status(404).json({ message: "Not found" });
    }

    const idx = STAGES.indexOf(delivery.status);
    const nextStatus = idx < STAGES.length - 1 ? STAGES[idx + 1] : STAGES[idx];
    delivery.status = nextStatus;
    delivery.updatedAt = new Date();
    await delivery.save();

    console.log(`[DELIVERY] Status advanced - orderId: ${orderId}, from: ${STAGES[idx]}, to: ${nextStatus}`);
    return res.status(200).json({ orderId, status: nextStatus, timeline: STAGES });
  } catch (error) {
    console.error(`[DELIVERY] Update status error:`, error.message);
    return res.status(500).json({ message: "Failed to update delivery status", error: error.message });
  }
});

const start = async () => {
  try {
    console.log("[DELIVERY] Starting Delivery Service...");
    await connectDB();
    const port = Number(process.env.PORT) || 5005;
    app.listen(port, () => console.log(`[DELIVERY] ✅ Delivery Service running on port ${port}`));
  } catch (error) {
    console.error("[DELIVERY] ❌ Failed to start delivery-service:", error.message);
    process.exit(1);
  }
};

start();