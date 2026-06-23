const express = require("express");
const router = express.Router();
const multer = require("multer");
const User = require("../models/User");

// ================= MULTER (same as server.js) =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "image"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// ================= GET PROFILE =================
router.get("/get/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    const user = await User.findOne({ email: token });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      image: user.image || ""
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================= UPDATE PROFILE =================
router.put("/update/profile", upload.single("image"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No token" });

    const user = await User.findOne({ email: token });

    if (!user) return res.status(404).json({ error: "User not found" });

    // update fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.address) user.address = req.body.address;

    if (req.file) {
      user.image = "/image/" + req.file.filename;
    }

    await user.save();

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;