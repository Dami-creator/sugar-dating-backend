const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  role: {
    type: String,
    enum: ["sugar_mummy", "sugar_daddy", "young_adult"],
    required: true
  },
  membership: {
    type: String,
    enum: ["free", "premium"],
    default: "free"
  },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
