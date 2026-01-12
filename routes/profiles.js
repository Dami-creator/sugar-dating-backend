const express = require("express");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// GET all users (browse) - free vs premium logic
router.get("/", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user);

    let users;
    if (currentUser.membership === "premium") {
      // Premium users see everyone
      users = await User.find({ _id: { $ne: currentUser._id } });
    } else {
      // Free users see only limited profiles (first 5)
      users = await User.find({ _id: { $ne: currentUser._id } }).limit(5);
    }

    res.json(users.map(u => ({
      name: u.name,
      role: u.role,
      bio: u.bio,
      photos: u.photos,
      location: u.location,
      membership: u.membership
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE profile (bio, location, photos)
router.put("/", auth, async (req, res) => {
  try {
    const { bio, location, photos } = req.body;
    const user = await User.findById(req.user);

    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (photos !== undefined) user.photos = photos;

    await user.save();
    res.json({ message: "Profile updated", profile: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
