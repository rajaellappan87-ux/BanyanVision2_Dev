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
const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

// POST /api/orders/create-payment  — create Razorpay order
orderRouter.post("/create-payment", protect, async (req, res) => {
  try {
    const { total } = req.body;
    const options = {
      amount: Math.round(total * 100), // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const razorpayOrder = await razorpay.orders.create(options);
    res.json({ success: true, orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
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

    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }

    // Send order confirmation email to customer + admin
    sendSafe(sendOrderConfirmation, { order, user: req.user });

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
    const order = await Order.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true }).populate("user", "name email");
    // Send status update email to customer
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

module.exports = { authRouter, productRouter, reviewRouter, orderRouter, wishlistRouter, couponRouter, adminRouter };
