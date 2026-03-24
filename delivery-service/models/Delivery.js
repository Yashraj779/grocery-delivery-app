const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    orderId: { type: Number, required: true, unique: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["Preparing", "Packed", "Out for Delivery", "Delivered"],
      default: "Preparing",
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

deliverySchema.pre("save", function saveHook(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Delivery", deliverySchema);
