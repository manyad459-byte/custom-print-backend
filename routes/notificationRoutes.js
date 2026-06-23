const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");

router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({
      createdAt: -1,
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch notifications",
    });
  }
});
router.delete("/", async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ message: "cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;