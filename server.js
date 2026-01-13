// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();
app.use(express.json());

// ✅ Allow all origins temporarily
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log("❌ MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  dateOfBirth: String,
  role: String
});
const User = mongoose.model("User", userSchema);

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, role } = req.body;
    if (!name || !email || !password || !dateOfBirth || !role)
      return res.status(400).json({ error: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, dateOfBirth, role });
    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Browse all users (protected)
app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Update profile
app.put("/api/users/:email", authMiddleware, async (req, res) => {
  try {
    const { name, password, dateOfBirth, role } = req.body;
    const updates = { name, dateOfBirth, role };
    if (password) updates.password = await bcrypt.hash(password, 10);

    const updated = await User.findOneAndUpdate(
      { email: req.params.email },
      updates,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Profile updated successfully" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
