const log = require("./logger");
const express  = require("express");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const Razorpay = require("razorpay");
const { body, validationResult } = require("express-validator");
const path = require("path");
const { User, Product, Review, Order, Coupon } = require(path.join(__dirname, "models"));
const { protect, adminOnly, upload, cloudinary } = require(path.join(__dirname, "middleware"));
const { sendOrderConfirmation, sendStatusUpdate, sendThankYou, sendSafe } = require(path.join(__dirname, "mailer"));
const { sendReviewAck } = require(path.join(__dirname, "mailer"));

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ════════════════════════════════════════════════════════════
// AUTH ROUTES  /api/auth
// ════════════════════════════════════════════════════════════
const authRouter = express.Router();

// POST /api/auth/register
authRouter.post("/register", [
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: "Email already registered" });
    const user = await User.create({ name, email, password });
    log.auth("New user registered", { email: user.email, role: user.role }, null, { ip: req.ip });
    res.status(201).json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    log.auth("User logged in", { email: user.email, role: user.role }, null, { userId: user._id, ip: req.ip });
    res.json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/auth/me
authRouter.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist", "name price images category");
  res.json({ success: true, user });
});

// PUT /api/auth/profile
authRouter.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, address }, { new: true });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
// PRODUCT ROUTES  /api/products
// ════════════════════════════════════════════════════════════
const productRouter = express.Router();

// GET /api/products  (with filter/sort/search/pagination)
productRouter.get("/", async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice, featured, trending, page = 1, limit = 12 } = req.query;
    const query = {};
    if (category && category !== "All") query.category = category;
    if (featured === "true") query.featured = true;
    if (trending === "true") query.trending = true;
    if (search) query.name = { $regex: search, $options: "i" };
    if (minPrice || maxPrice) query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);

    const sortMap = { "price-asc": { price: 1 }, "price-desc": { price: -1 }, "rating": { rating: -1 }, "newest": { createdAt: -1 } };
    const sortObj = sortMap[sort] || { createdAt: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortObj).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/products/:id
productRouter.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });
    res.json({ success: true, product, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/products  (admin) — upload up to 6 images
productRouter.post("/", protect, adminOnly, upload.array("images", 6), async (req, res) => {
  try {
    const images = req.files?.map(f => ({ url: f.path, public_id: f.filename })) || [];
    const sizes  = JSON.parse(req.body.sizes  || "[]");
    const colors = JSON.parse(req.body.colors || "[]");
    const product = await Product.create({ ...req.body, images, sizes, colors,
      price: Number(req.body.price), originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : null,
      stock: Number(req.body.stock), featured: req.body.featured === "true", trending: req.body.trending === "true",
    });
    res.status(201).json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/products/:id  (admin) — can add/replace images
productRouter.put("/:id", protect, adminOnly, upload.array("images", 6), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Delete old Cloudinary images if new ones uploaded
    const newImages = req.files?.map(f => ({ url: f.path, public_id: f.filename })) || [];
    if (newImages.length > 0) {
      for (const img of product.images) { await cloudinary.uploader.destroy(img.public_id); }
    }

    const updates = { ...req.body };
    if (newImages.length > 0) updates.images = newImages;
    if (req.body.sizes)  updates.sizes  = JSON.parse(req.body.sizes);
    if (req.body.colors) updates.colors = JSON.parse(req.body.colors);
    if (req.body.price)  updates.price  = Number(req.body.price);
    if (req.body.stock)  updates.stock  = Number(req.body.stock);

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, product: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/products/:id  (admin)
productRouter.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    for (const img of product.images) { await cloudinary.uploader.destroy(img.public_id); }
    await product.deleteOne();
    res.json({ success: true, message: "Product deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/products/:id/images/:public_id  (admin) — remove single image
productRouter.delete("/:id/images/:public_id", protect, adminOnly, async (req, res) => {
  try {
    const pid = decodeURIComponent(req.params.public_id);
    await cloudinary.uploader.destroy(pid);
    await Product.findByIdAndUpdate(req.params.id, { $pull: { images: { public_id: pid } } });
    res.json({ success: true, message: "Image removed" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
// REVIEW ROUTES  /api/reviews
// ════════════════════════════════════════════════════════════
const reviewRouter = express.Router();

// POST /api/reviews
reviewRouter.post("/", protect, [body("rating").isInt({ min:1, max:5 }), body("comment").notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { productId, rating, comment } = req.body;
    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: "You have already reviewed this product" });
    const hasOrdered = await Order.findOne({ user: req.user._id, "items.product": productId, status: "delivered" });
    const review = await Review.create({ product: productId, user: req.user._id, userName: req.user.name, rating, comment, verified: !!hasOrdered });

    // Recalculate product rating
    const allReviews = await Review.find({ product: productId });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, { rating: avg.toFixed(1), numReviews: allReviews.length });

    // Send review acknowledgement to customer + notify admin
    const product = await Product.findById(productId).select("name images");
    sendSafe(sendReviewAck, { user: req.user, product, review });

    res.status(201).json({ success: true, review });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/reviews/:id/helpful
reviewRouter.put("/:id/helpful", protect, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpful: 1 } }, { new: true });
    res.json({ success: true, helpful: review.helpful });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
// ORDER ROUTES  /api/orders
// ════════════════════════════════════════════════════════════
const orderRouter = express.Router();
// Create a fresh Razorpay instance per-request so env var changes take effect immediately
const getRazorpay = () => {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys not configured in environment variables");
  if (!keyId.startsWith("rzp_")) throw new Error(`Invalid Razorpay key format: ${keyId.substring(0,8)}...`);
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// POST /api/orders/create-payment  — create Razorpay order
orderRouter.post("/create-payment", protect, async (req, res) => {
  try {
    const { total } = req.body;
    if (!total || total <= 0) return res.status(400).json({ success: false, message: "Invalid order amount" });

    // Validate Razorpay keys are set
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret)     return res.status(500).json({ success: false, message: "Payment gateway not configured" });
    if (!keyId.startsWith("rzp_")) return res.status(500).json({ success: false, message: "Invalid Razorpay key format" });

    const options = {
      amount:   Math.round(total * 100), // convert rupees → paise
      currency: "INR",
      receipt:  `bv_${Date.now()}`,
    };
    log.payment("Creating Razorpay order", { amount: options.amount, currency: options.currency });
    const rzpOrder = await getRazorpay().orders.create(options);
    log.payment("Razorpay order created", { orderId: rzpOrder.id, amount: rzpOrder.amount });
    res.json({
      success:  true,
      orderId:  rzpOrder.id,
      amount:   rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId,    // send key to frontend (public key — safe to expose)
    });
  } catch (err) {
    log.error("payment", "Razorpay create-payment failed", { message: err.message, keyId: process.env.RAZORPAY_KEY_ID?.substring(0,14) }, err, { userId: req.user?._id, ip: req.ip });
    res.status(500).json({ success: false, message: err.error?.description || err.message });
  }
});


// GET /api/orders/payment-check  — admin diagnostic to verify Razorpay keys
orderRouter.get("/payment-check", protect, adminOnly, async (req, res) => {
  const keyId     = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const isLive    = keyId.startsWith("rzp_live_");
  const isTest    = keyId.startsWith("rzp_test_");
  const valid     = isLive || isTest;

  // Try creating a dummy ₹1 order to verify keys actually work
  let apiOk = false;
  let apiError = null;
  if (valid) {
    try {
      const rzp = getRazorpay();
      await rzp.orders.create({ amount: 100, currency: "INR", receipt: "check" });
      apiOk = true;
    } catch (e) {
      apiError = e.error?.description || e.message;
    }
  }

  res.json({
    keyId:    keyId ? `${keyId.substring(0, 14)}...` : "NOT SET",
    keySecret:keySecret ? `${keySecret.substring(0, 6)}...` : "NOT SET",
    mode:     isLive ? "LIVE" : isTest ? "TEST" : "INVALID",
    valid,
    apiOk,
    apiError,
    message:  !valid         ? "Keys not set or invalid format (must start with rzp_live_ or rzp_test_)"
            : !apiOk         ? `Keys set but API call failed: ${apiError}`
            : isLive         ? "✅ Live mode — real payments enabled"
            :                  "✅ Test mode — use test cards",
  });
});

// POST /api/orders  — verify payment and create order
orderRouter.post("/", protect, async (req, res) => {
  try {
    const { items, shippingAddress, subtotal, discount, shipping, total, coupon, paymentId, paymentOrderId, paymentSignature } = req.body;

    // Verify Razorpay signature
    const expectedSig = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${paymentOrderId}|${paymentId}`).digest("hex");
    if (expectedSig !== paymentSignature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Update coupon usage
    if (coupon) await Coupon.findOneAndUpdate({ code: coupon }, { $inc: { usedCount: 1 } });

    const order = await Order.create({
      user: req.user._id, items, shippingAddress, subtotal, discount, shipping, total, coupon,
      paymentId, paymentOrderId, paymentSignature, isPaid: true, paidAt: Date.now(),
    });

    log.info("app", "New order created", { orderId: order._id, total: order.total, userId: req.user._id }, { userId: req.user._id, userEmail: req.user.email });
    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }

    // Send order confirmation email to customer + admin
    // Populate order items properly for email
    const populatedOrder = await Order.findById(order._id);
    log.mail("Sending order confirmation email", { to: req.user.email, orderId: order._id });
    sendSafe(sendOrderConfirmation, { order: populatedOrder, user: req.user });

    res.status(201).json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/orders/my  — user's orders
orderRouter.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/orders  (admin) — with optional status filter
orderRouter.get("/", protect, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    const orders = await Order.find(filter).populate("user", "name email").sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/orders/:id  (admin)
orderRouter.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    await order.deleteOne();
    res.json({ success: true, message: "Order deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/orders/export-email  (admin) — send CSV to admin email
orderRouter.post("/export-email", protect, adminOnly, async (req, res) => {
  try {
    const { statusFilter = "all" } = req.body;
    const { sendOrdersExportEmail } = require(path.join(__dirname, "mailer"));
    const filter = statusFilter !== "all" ? { status: statusFilter } : {};
    const orders = await Order.find(filter).populate("user","name email").sort({ createdAt: -1 });
    await sendOrdersExportEmail({ orders, statusFilter, adminEmail: process.env.ADMIN_EMAIL || "admin@banyanvision.com" });
    res.json({ success: true, message: `Export email sent with ${orders.length} orders` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/orders/:id/status  (admin)
orderRouter.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const newStatus = req.body.status;
    const order = await Order.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true }).populate("user", "name email phone");
    // Send status update email to customer
    log.info("app", `Order status updated: ${newStatus}`, { orderId: req.params.id, status: newStatus }, { userId: req.user?._id });
    if (order.user && order.user.email) {
      sendSafe(sendStatusUpdate, { order, user: order.user, newStatus });
      // Extra thank-you email on delivery
      if (newStatus === "delivered") {
        setTimeout(() => sendSafe(sendThankYou, { order, user: order.user }), 5000);
      }
    }
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
// WISHLIST  /api/wishlist
// ════════════════════════════════════════════════════════════
const wishlistRouter = express.Router();

wishlistRouter.post("/toggle", protect, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    const idx  = user.wishlist.indexOf(productId);
    if (idx > -1) { user.wishlist.splice(idx, 1); }
    else { user.wishlist.push(productId); }
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

wishlistRouter.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
// COUPON  /api/coupons
// ════════════════════════════════════════════════════════════
const couponRouter = express.Router();

couponRouter.post("/validate", protect, async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.body.code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Invalid or expired coupon" });
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    res.json({ success: true, coupon: { code: coupon.code, type: coupon.type, discount: coupon.discount, desc: coupon.desc, minOrder: coupon.minOrder } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

couponRouter.get("/", protect, adminOnly, async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

couponRouter.post("/", protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

couponRouter.delete("/:id", protect, adminOnly, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Coupon deleted" });
});

// ════════════════════════════════════════════════════════════
// ADMIN ANALYTICS  /api/admin
// ════════════════════════════════════════════════════════════
const adminRouter = express.Router();
adminRouter.use(protect, adminOnly);

adminRouter.get("/stats", async (req, res) => {
  try {
    const [totalOrders, totalUsers, totalProducts, revenueData] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);
    const statusBreakdown = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const categoryRevenue = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.category", revenue: { $sum: { $multiply: ["$items.price","$items.qty"] } } } },
      { $sort: { revenue: -1 } },
    ]);
    const topProducts = await Product.find().sort({ numReviews: -1 }).limit(5).select("name images numReviews rating");
    res.json({ success: true, stats: {
      totalOrders, totalUsers, totalProducts,
      totalRevenue: revenueData[0]?.total || 0,
      statusBreakdown, categoryRevenue, topProducts,
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

adminRouter.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/admin/users — create a new customer or admin user
adminRouter.post("/users", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Name, email and password are required" });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: "Email already registered" });
    const user = await User.create({ name, email: email.toLowerCase(), password, phone: phone || "", role: role || "user", active: true });
    const out = user.toObject(); delete out.password;
    res.status(201).json({ success: true, user: out });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/admin/inventory/:id — update stock for a product
adminRouter.patch("/inventory/:id", async (req, res) => {
  try {
    const { stock, adjustment, note } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    
    let newStock;
    if (adjustment !== undefined) {
      // Relative adjustment: +20, -5 etc
      newStock = Math.max(0, product.stock + Number(adjustment));
    } else {
      // Absolute set
      newStock = Math.max(0, Number(stock));
    }
    product.stock = newStock;
    await product.save();
    res.json({ success: true, product: { _id: product._id, name: product.name, stock: product.stock } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/inventory — all products with stock info
adminRouter.get("/inventory", async (req, res) => {
  try {
    const products = await Product.find()
      .select("name category price stock images badge featured trending createdAt")
      .sort({ stock: 1 }); // low stock first
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/admin/users/:id/toggle — activate or deactivate account
adminRouter.put("/users/:id/toggle", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot deactivate your own account" });
    user.active = !user.active;
    await user.save();
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/admin/users/:id/role — change role between user/admin
adminRouter.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user","admin"].includes(role)) return res.status(400).json({ success: false, message: "Role must be user or admin" });
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot change your own role" });
    user.role = role;
    await user.save();
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/admin/users/:id — delete a user account
adminRouter.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    await user.deleteOne();
    res.json({ success: true, message: "User deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});


// ─── Site Config Router ───────────────────────────────────────────────────────
const { SiteConfig } = require("./models");
const configRouter = express.Router();

// GET /api/config/:key — public read
configRouter.get("/:key", async (req, res) => {
  try {
    const doc = await SiteConfig.findOne({ key: req.params.key });
    res.json({ value: doc ? doc.value : null });
  } catch (e) {
    log.error("db", `Config read failed: ${e.message}`, { key: req.params.key }, e);
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/config/:key — admin only write
configRouter.put("/:key", protect, adminOnly, async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ message: "value required" });
    const doc = await SiteConfig.findOneAndUpdate(
      { key: req.params.key },
      { key: req.params.key, value },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ value: doc.value });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// LOG ROUTES — admin audit log viewer + frontend log receiver
// ═════════════════════════════════════════════════════════════════════════════
const { Log } = require("./models");
const logRouter = express.Router();

// GET /api/logs — admin: get logs with filters
logRouter.get("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      level, category, source,
      from, to,
      search,
      page = 1,
      limit = 100,
    } = req.query;

    const filter = {};
    if (level    && level    !== "all") filter.level    = level;
    if (category && category !== "all") filter.category = category;
    if (source   && source   !== "all") filter.source   = source;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    if (search) {
      filter.$or = [
        { message:   { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { path:      { $regex: search, $options: "i" } },
      ];
    }

    const total = await Log.countDocuments(filter);
    const logs  = await Log.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ success: true, logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    log.error("api", "Failed to fetch logs", { error: err.message }, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/logs/stats — log counts by level for last 24h
logRouter.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stats = await Log.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ]);
    const byCategory = await Log.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    res.json({ success: true, byLevel: stats, byCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/logs/frontend — receive logs from frontend
logRouter.post("/frontend", async (req, res) => {
  try {
    // Rate limit frontend log submissions
    const { level, category, message, details, stack, path: fePath } = req.body;
    if (!message) return res.status(400).json({ message: "message required" });
    log.frontend({
      level, category, message, details, stack,
      path: fePath,
      userId:    req.user?._id,
      userEmail: req.user?.email,
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// DELETE /api/logs — admin: clear all logs
logRouter.delete("/", protect, adminOnly, async (req, res) => {
  try {
    const result = await Log.deleteMany({});
    log.info("system", `Admin cleared all logs`, { deleted: result.deletedCount }, { userId: req.user._id });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports.logRouter = logRouter;

module.exports = { authRouter, productRouter, reviewRouter, orderRouter, wishlistRouter, couponRouter, adminRouter, configRouter, logRouter };
