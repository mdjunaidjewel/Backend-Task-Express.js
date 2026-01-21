const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Stripe = require("stripe");
require("dotenv").config();

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors());

// Stripe webhook needs RAW body (only for this route)
app.use("/webhook", express.raw({ type: "application/json" }));

// All other routes use JSON
app.use(express.json());

/* -------------------- ENV CHECK -------------------- */
if (
  !process.env.MONGO_URI ||
  !process.env.JWT_SECRET ||
  !process.env.STRIPE_SECRET ||
  !process.env.STRIPE_WEBHOOK_SECRET
) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

/* -------------------- STRIPE -------------------- */
const stripe = Stripe(process.env.STRIPE_SECRET);

/* -------------------- DB CONNECT -------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

/* -------------------- USER MODEL -------------------- */
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

/* -------------------- AUTH MIDDLEWARE -------------------- */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "No token" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* -------------------- AUTH ROUTES -------------------- */

// Register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Profile
app.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- PRODUCT MODEL -------------------- */
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);

// Create Product
app.post("/products", auth, async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || !price)
      return res.status(400).json({ message: "Name and price required" });

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- ORDER MODEL -------------------- */
const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paymentId: String,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

// Create Order + PaymentIntent
app.post("/orders", auth, async (req, res) => {
  try {
    const { product, amount } = req.body;
    if (!product || !amount)
      return res.status(400).json({ message: "Product and amount required" });

    const order = await Order.create({
      user: req.user.id,
      product,
      amount,
    });

    const intent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      metadata: { orderId: order._id.toString() },
    });

    res.status(201).json({
      order,
      clientSecret: intent.client_secret,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// User Orders
app.get("/orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- STRIPE WEBHOOK -------------------- */
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const intent = event.data.object;
  const order = await Order.findById(intent.metadata.orderId);

  if (order) {
    order.status =
      event.type === "payment_intent.succeeded" ? "success" : "failed";
    order.paymentId = intent.id;
    await order.save();
  }

  res.json({ received: true });
});

/* -------------------- TEST -------------------- */
app.get("/", (req, res) => res.send("🚀 Server Running..."));

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🔥 Server running on ${PORT}`)
);
