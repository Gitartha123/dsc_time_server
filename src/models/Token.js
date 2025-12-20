const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  productId: { type: String, required: true },
  orgId: { type: String },
  machineHash: { type: String, required: true },

  maxSigns: { type: Number, default: 1000 },
  usedSigns: { type: Number, default: 0 },

  validTill: { type: Date, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("tokens", TokenSchema);
