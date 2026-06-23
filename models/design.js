const mongoose = require("mongoose");

const designSchema = new mongoose.Schema(
  {
    name: String,
    previewImage: String, // image preview
    designData: Object,   // fabric canvas JSON
    userId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Design", designSchema);