const express = require("express");
const router = express.Router();
const Product = require("../models/product");

// GET ALL PRODUCTS
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("ERROR FETCHING PRODUCTS:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;