const express = require("express");
const router = express.Router();
const Design = require("../models/Design");

// 💾 Save design
router.post("/save", async (req, res) => {
  try {
    const { design, previewImage } = req.body;

    const newDesign = new Design({
      design,
      previewImage,
    });

    await newDesign.save();

    res.json({ message: "Saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;