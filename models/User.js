const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    default: "user"
  },

  // ✅ PROFILE FIELDS
  name: {
    type: String,
    default: ""
  },

  phone: {
    type: String,
    default: ""
  },

  address: {
    type: String,
    default: ""
  },

  image: {
    type: String,
    default: ""
  }

});

module.exports = mongoose.model("User", userSchema);