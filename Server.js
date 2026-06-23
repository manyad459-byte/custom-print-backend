const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const Razorpay = require("razorpay");
const http = require("http");
const app = express();
const profileRoutes = require("./routes/profileRoutes");
const notificationRoutes=require("./routes/notificationRoutes");
require("dotenv").config();

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});
console.log("KEY:", process.env.RAZORPAY_KEY_ID);
console.log("SECRET:", process.env.RAZORPAY_KEY_SECRET);
console.log("🔥 SERVER FILE IS RUNNING");


// ===================== CORS =====================
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://custom-print-beige.vercel.app"
  ],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use("/notifications", notificationRoutes);

// ===================== MODELS =====================
const Product = require("./models/product");
const User = require("./models/User");
const Order = require("./models/Order");
const Notification = require("./models/Notification");
const OrderRoutes = require("./routes/OrderRoutes");

app.use("/api/orders", OrderRoutes);
app.use("/api/users", profileRoutes);

// ===================== RAZORPAY =====================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_SECRET",
});
// ===================== CREATE RAZORPAY ORDER =====================

app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: Number(req.body.amount) * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (err) {
    console.log("Razorpay Error:", err);

    res.status(500).json({
      error: "Failed to create Razorpay order",
    });
  }
});

// ===================== STATIC IMAGE =====================
app.use("/image", express.static(path.join(__dirname, "image")));
// ===================== MULTER =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("video")) {
      cb(null, "uploads/videos");
    } else {
      cb(null, "image");
    }
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });
// ===================== DB CONNECT =====================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));


// ===================== PRODUCTS =====================
app.post("/add-product", upload.single("image"), async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      image: "/image/" + req.file.filename
    });

    await product.save();
    res.json({ message: "Product added" });
  } catch (err) {
    res.status(500).json({ error: "Error adding product" });
  }
});

app.get("/products", async (req, res) => {
  const data = await Product.find();
  res.json(data);
});

app.get("/api/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});
// UPDATE PRODUCT
app.put("/product/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
    };

    if (req.file) {
      updateData.image = "/image/" + req.file.filename;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Failed to update product",
    });
  }
});

// DELETE PRODUCT
app.delete("/product/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Failed to delete product",
    });
  }
});

// ===================== AUTH =====================
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || user.password !== req.body.password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({ user: { email: user.email, role: user.role } });
});

app.post("/register", async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });

  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = new User(req.body);
  await newUser.save();

  res.json({ message: "Registered successfully" });
});
// ===================== USERS =====================
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

// ===================== ORDER (NO NOTIFICATION) =====================
// ===================== ORDER =====================
app.post("/order", async (req, res) => {
  try {
    const {
      userId,
      customerName,
      phoneNumber,
      products,
      totalAmount,
      address,
      paymentMethod,
    } = req.body;

    if (!userId || !products || products.length === 0 || !address) {
      return res.status(400).json({
        error: "Invalid order data ❌",
      });
    }

    // ✅ SAVE ORDER
    const newOrder = new Order({
      userId,
      customerName,
      phoneNumber,
      products,
      totalAmount,
      address,
      paymentMethod,
      status: "pending",
    });

    await newOrder.save();

    // ✅ SAVE NOTIFICATION
    await Notification.create({
      userId,
      title: "Order Placed 🎉",
      message: `Your order of ₹${totalAmount} has been placed successfully`,
    });

    res.json({
      success: true,
      message: "Order placed successfully",
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Order failed ❌",
    });
  }
});

// ===================== ORDERS =====================
app.get("/orders", async (req, res) => {
  const data = await Order.find();
  res.json(data);
});

app.get("/orders/:userId", async (req, res) => {
  const data = await Order.find({ userId: req.params.userId });
  res.json(data);
});
app.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// ===================== DESIGN =====================
const Design = require("./models/Design");

app.post("/api/designs", async (req, res) => {
  const design = new Design(req.body);
  await design.save();
  res.json(design);
});

app.get("/api/designs", async (req, res) => {
  const data = await Design.find().sort({ createdAt: -1 });
  res.json(data);
});
// ===================== SERVER =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});