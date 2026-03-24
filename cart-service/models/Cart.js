const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    name: { type: String, trim: true, default: "" },
    price: { type: Number, min: 0, default: 0 },
    image: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Cart", cartSchema);
