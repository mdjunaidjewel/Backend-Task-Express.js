const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Stripe = require("stripe");
require("dotenv").config();

const app = express();
app.use(cors());

// Stripe setup
const stripe = Stripe(process.env.STRIPE_SECRET);

// Use raw body for Stripe webhook verification
app.use(
  "/webhook",
  express.raw({ type: "application/json" })
);

// Other routes use JSON
app.use(express.json());

/* -------------------- DB CONNECT -------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* -------------------- USER MODEL -------------------- */
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
  },
  { timestamps: { createdAt: "userCreatedAt", updatedAt: "userUpdatedAt" } }
);

const User = mongoose.model("User", UserSchema);

/* -------------------- AUTH MIDDLEWARE -------------------- */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* -------------------- ROUTES -------------------- */

// Register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userCreatedAt: user.userCreatedAt,
        userUpdatedAt: user.userUpdatedAt,
      },
    });
  } catch (error) {
    console.error(error);
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Profile
app.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error(error);
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
    const { name, description, price, category } = req.body;
    if (!name || !price) return res.status(400).json({ message: "Name and price required" });

    const product = await Product.create({ name, description, price, category });
    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// List Products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- ORDER MODEL -------------------- */
const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    paymentId: String,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

// Create Order + Stripe PaymentIntent
app.post("/orders", auth, async (req, res) => {
  try {
    const { product, amount } = req.body;
    if (!product || !amount) return res.status(400).json({ message: "Product and amount required" });

    const order = await Order.create({ user: req.user.id, product, amount, status: "pending" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      metadata: { orderId: order._id.toString() },
    });

    res.status(201).json({ message: "Order created, payment initiated", order, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// List all orders for logged-in user
app.get("/orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Stripe Webhook (signature verification)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // set in .env
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const order = await Order.findById(paymentIntent.metadata.orderId);
      if (order) {
        order.status = "success";
        order.paymentId = paymentIntent.id;
        await order.save();
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const order = await Order.findById(paymentIntent.metadata.orderId);
      if (order) {
        order.status = "failed";
        order.paymentId = paymentIntent.id;
        await order.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Webhook processing error" });
  }
});

// Test
app.get("/", (req, res) => res.send("Server Running..."));

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
