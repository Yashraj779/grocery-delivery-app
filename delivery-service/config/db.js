const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  try {
    console.log(`[DELIVERY-DB] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log(`[DELIVERY-DB] ✅ Delivery Service DB connected successfully`);
  } catch (error) {
    console.error(`[DELIVERY-DB] ❌ Connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
