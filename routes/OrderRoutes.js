const express = require("express");
const router = express.Router();

const Order = require("../models/Order");

// ✅ CREATE ORDER (CLEAN - NO NOTIFICATION)
router.post("/", async (req, res) => {
  try {
    const { userId, products, totalAmount, address, paymentMethod } = req.body;

    // 🔒 VALIDATION
    if (!userId || !products || products.length === 0 || !address) {
      return res.status(400).json({ error: "Invalid order data ❌" });
    }

    // 1️⃣ SAVE ORDER
    const newOrder = new Order({
      userId,
      products,
      totalAmount,
      address,
      paymentMethod,
      status: "pending"
    });

    await newOrder.save();

    // ❌ NOTIFICATION REMOVED COMPLETELY

    res.status(201).json({
      success: true,
      order: newOrder
    });

  } catch (err) {
    console.log("ORDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;