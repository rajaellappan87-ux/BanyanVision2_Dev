/**
 * BV_Plaza/backend/plazaRoutes.js
 * All REST API routes for BV Plaza
 * Mounted at /api/plaza in server.js
 */
const express  = require("express");
const router   = express.Router();
const path     = require("path");
const crypto   = require("crypto");
const Razorpay = require(path.join(__dirname, "..", "..", "backend", "node_modules", "razorpay"));

const {
  Stall, PlazaProduct, StallCoupon,
  BankDetail, Wallet, WalletTransaction,
  PlazaOrder, PlazaChat, Withdrawal,
} = require(path.join(__dirname, "plazaModels"));

// ─── Reuse existing middleware and models ─────────────────────────────────────
const { protect, adminOnly, cloudinary } = require(path.join(__dirname, "..", "..", "backend", "middleware"));
const { SiteConfig } = require(path.join(__dirname, "..", "..", "backend", "models"));

// ─── Plaza-specific Multer/Cloudinary upload instances ────────────────────────
const multer             = require(path.join(__dirname, "..", "..", "backend", "node_modules", "multer"));
const { CloudinaryStorage } = require(path.join(__dirname, "..", "..", "backend", "node_modules", "multer-storage-cloudinary"));

const productImgStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "bvplaza/products", allowed_formats: ["jpg","jpeg","png","webp"],
            transformation: [{ quality: "auto:good" }] },
});
const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "bvplaza/logos", allowed_formats: ["jpg","jpeg","png","webp"],
            transformation: [{ width: 600, height: 600, crop: "fill", quality: "auto" }] },
});

const uploadProductImg = multer({ storage: productImgStorage, limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Images only")) });
const uploadLogo = multer({ storage: logoStorage, limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Images only")) });

// ─── Plaza setting helpers (stored in existing SiteConfig collection) ─────────
const PLAZA_KEY = "plaza_setting";
const defaultSetting = { enabled: true, title: "BV Plaza", tagline: "India's Live Shopping Marketplace" };

const getPlazaSetting = async () => {
  const cfg = await SiteConfig.findOne({ key: PLAZA_KEY });
  return cfg ? cfg.value : defaultSetting;
};

const savePlazaSetting = async (data) => {
  await SiteConfig.findOneAndUpdate(
    { key: PLAZA_KEY },
    { key: PLAZA_KEY, value: data },
    { upsert: true, new: true }
  );
  return data;
};

// ─── Native driver helper — use same mongoose instance as server.js ───────────
const mongoose = require(path.join(__dirname, "..", "..", "backend", "node_modules", "mongoose"));

const col = (name) => mongoose.connection.db.collection(name);

// ─── Razorpay helper ──────────────────────────────────────────────────────────
const getRazorpay = () => {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys not configured");
  if (!keyId.startsWith("rzp_"))  throw new Error("Invalid Razorpay key format");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getOrCreateWallet = async (userId, stallId) => {
  const wallets = col("wallets");
  let wallet = await wallets.findOne({ owner: userId }, { maxTimeMS: 5000 });
  if (!wallet) {
    const doc = { owner: userId, stall: stallId, balance: 0, totalEarned: 0, totalWithdrawn: 0, createdAt: new Date(), updatedAt: new Date() };
    await wallets.insertOne(doc, { maxTimeMS: 5000 });
    wallet = doc;
  }
  return wallet;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET  /api/plaza/admin/setting  — get plaza visibility setting
router.get("/admin/setting", protect, adminOnly, async (req, res) => {
  try {
    const setting = await getPlazaSetting();
    res.json({ success: true, setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT  /api/plaza/admin/setting  — toggle plaza on/off
router.put("/admin/setting", protect, adminOnly, async (req, res) => {
  try {
    const { enabled, title, tagline } = req.body;
    const current = await getPlazaSetting();
    const updated = {
      ...current,
      ...(enabled !== undefined && { enabled }),
      ...(title   !== undefined && { title }),
      ...(tagline !== undefined && { tagline }),
    };
    await savePlazaSetting(updated);
    res.json({ success: true, setting: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET  /api/plaza/admin/stalls  — list all stalls for admin
router.get("/admin/stalls", protect, adminOnly, async (req, res) => {
  try {
    const stalls = await Stall.find().populate("owner", "name email").sort({ createdAt: -1 }).maxTimeMS(5000);
    res.json({ success: true, stalls });
  } catch (err) {
    res.json({ success: true, stalls: [] });
  }
});

// PUT  /api/plaza/admin/stalls/:id  — verify/activate stall
router.put("/admin/stalls/:id", protect, adminOnly, async (req, res) => {
  try {
    const { isVerified, isActive } = req.body;
    const stall = await Stall.findByIdAndUpdate(
      req.params.id,
      { ...(isVerified !== undefined && { isVerified }), ...(isActive !== undefined && { isActive }) },
      { new: true }
    );
    res.json({ success: true, stall });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET  /api/plaza/admin/withdrawals  — list all withdrawal requests
router.get("/admin/withdrawals", protect, adminOnly, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate("owner", "name email")
      .populate("bankDetail")
      .sort({ createdAt: -1 })
      .maxTimeMS(5000);
    res.json({ success: true, withdrawals });
  } catch (err) {
    res.json({ success: true, withdrawals: [] });
  }
});

// PUT  /api/plaza/admin/withdrawals/:id  — process withdrawal
router.put("/admin/withdrawals/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ success: false, message: "Not found" });

    withdrawal.status = status;
    if (remarks) withdrawal.remarks = remarks;
    if (status === "completed") withdrawal.processedAt = new Date();
    await withdrawal.save();

    if (status === "completed") {
      await WalletTransaction.create({
        wallet: withdrawal.wallet,
        owner:  withdrawal.owner,
        type:   "withdrawal",
        amount: withdrawal.netAmount,
        description: `Withdrawal processed. Fee: ₹${withdrawal.processingFee}`,
        status: "completed",
        referenceId: withdrawal._id.toString(),
      });
    }

    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET  /api/plaza/setting  — get plaza setting (public, for home page panel)
router.get("/setting", async (req, res) => {
  try {
    const setting = await getPlazaSetting();
    res.json({ success: true, setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET  /api/plaza/stalls  — list all active stalls for buyers
router.get("/stalls", async (req, res) => {
  try {
    const { category, search, online } = req.query;
    const filter = { isActive: true };
    if (category) filter.categories = { $in: [category] };
    if (search)   filter.shopName   = { $regex: search, $options: "i" };
    if (online === "true") {
      const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
      filter.isOnline = true;
      filter.lastHeartbeat = { $gte: twoMinsAgo };
    }
    const stalls = await Stall.find(filter)
      .populate("owner", "name")
      .select("shopName description logo categories isOnline lastHeartbeat rating numReviews totalSales owner")
      .sort({ isOnline: -1, rating: -1 })
      .maxTimeMS(5000);
    const now = Date.now();
    const annotated = stalls.map(s => {
      const obj = s.toObject();
      obj.isActuallyOnline = s.isOnline && (now - new Date(s.lastHeartbeat).getTime()) < 2 * 60 * 1000;
      return obj;
    });
    res.json({ success: true, stalls: annotated });
  } catch (err) {
    res.json({ success: true, stalls: [] }); // return empty instead of 500
  }
});

// GET  /api/plaza/stalls/:id  — get single stall
router.get("/stalls/:id", async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.id).populate("owner", "name email");
    if (!stall) return res.status(404).json({ success: false, message: "Stall not found" });
    const products = await PlazaProduct.find({ stall: stall._id, isActive: true });
    const coupons  = await StallCoupon.find({ stall: stall._id, active: true });
    const now = Date.now();
    const stallObj = stall.toObject();
    stallObj.isActuallyOnline = stall.isOnline && (now - new Date(stall.lastHeartbeat).getTime()) < 2 * 60 * 1000;
    res.json({ success: true, stall: stallObj, products, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET  /api/plaza/stalls/:id/products  — stall products
router.get("/stalls/:id/products", async (req, res) => {
  try {
    const products = await PlazaProduct.find({ stall: req.params.id, isActive: true });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHOP OWNER ROUTES (protected)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/plaza/shop/register  — register as shop owner
router.post("/shop/register", protect, async (req, res) => {
  try {
    console.log("[Plaza Register] db ready?", !!mongoose.connection.db, "user:", req.user?._id);
    const { shopName, description, categories, termsAccepted } = req.body;
    if (!shopName)      return res.status(400).json({ success: false, message: "Shop name is required" });
    if (!termsAccepted) return res.status(400).json({ success: false, message: "You must accept terms" });

    const stalls = col("stalls");

    const existing = await stalls.findOne({ owner: req.user._id }, { maxTimeMS: 5000 });
    if (existing) return res.status(400).json({ success: false, message: "You already have a stall" });

    const trialEnd = new Date();
    trialEnd.setMonth(trialEnd.getMonth() + 1);

    // Normalise categories — frontend sends object or array
    let cats = categories || [];
    if (!Array.isArray(cats)) cats = Object.values(cats);

    const stallDoc = {
      owner:              req.user._id,
      shopName:           shopName.trim(),
      description:        description || "",
      categories:         cats,
      termsAccepted:      true,
      subscriptionStatus: "trial",
      subscriptionPlan:   "monthly",
      trialStartDate:     new Date(),
      trialEndDate:       trialEnd,
      isOnline:           false,
      lastHeartbeat:      new Date(),
      returnPolicy:       "7 days return policy",
      deliveryDays:       5,
      rating:             0,
      numReviews:         0,
      totalSales:         0,
      isActive:           true,
      isVerified:         false,
      bankDetailsAdded:   false,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    };

    const result = await stalls.insertOne(stallDoc, { maxTimeMS: 5000 });
    stallDoc._id = result.insertedId;

    // Create wallet
    await col("wallets").insertOne({
      owner: req.user._id, stall: result.insertedId,
      balance: 0, totalEarned: 0, totalWithdrawn: 0,
      createdAt: new Date(), updatedAt: new Date(),
    }, { maxTimeMS: 5000 });

    res.json({ success: true, stall: stallDoc, message: "Welcome to BV Plaza! Your 1-month free trial has started." });
  } catch (err) {
    console.error("[Plaza Register] ERROR:", err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET  /api/plaza/shop/me  — get own stall
router.get("/shop/me", protect, async (req, res) => {
  try {
    console.log("[Plaza /shop/me] db:", !!mongoose.connection.db, "user:", req.user?._id);
    const stall = await col("stalls").findOne({ owner: req.user._id }, { maxTimeMS: 5000 });
    if (!stall) return res.status(404).json({ success: false, message: "No stall found" });

    const wallet     = await col("wallets").findOne({ owner: req.user._id }, { maxTimeMS: 5000 });
    const bankDetail = await col("bankdetails").findOne({ owner: req.user._id }, { maxTimeMS: 5000 });

    const now = Date.now();
    stall.isActuallyOnline = stall.isOnline && (now - new Date(stall.lastHeartbeat).getTime()) < 2 * 60 * 1000;

    // Check if trial expired
    if (stall.subscriptionStatus === "trial" && stall.trialEndDate < new Date()) {
      stall.subscriptionStatus = "expired";
      await col("stalls").updateOne({ _id: stall._id }, { $set: { subscriptionStatus: "expired" } }, { maxTimeMS: 5000 });
    }

    res.json({ success: true, stall, wallet, bankDetail });
  } catch (err) {
    console.error("[Plaza /shop/me] ERROR:", err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT  /api/plaza/shop/me  — update stall settings
router.put("/shop/me", protect, async (req, res) => {
  try {
    const stall = await Stall.findOne({ owner: req.user._id });
    if (!stall) return res.status(404).json({ success: false, message: "No stall found" });

    const allowed = ["shopName","description","categories","returnPolicy","deliveryDays"];
    allowed.forEach(k => { if (req.body[k] !== undefined) stall[k] = req.body[k]; });
    await stall.save();
    res.json({ success: true, stall });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plaza/shop/heartbeat  — keep shop online
router.post("/shop/heartbeat", protect, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const stall = await Stall.findOne({ owner: req.user._id });
    if (!stall) return res.status(404).json({ success: false, message: "No stall" });
    stall.isOnline      = isOnline !== false;
    stall.lastHeartbeat = new Date();
    await stall.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plaza/shop/subscribe  — subscribe after trial
router.post("/shop/subscribe", protect, async (req, res) => {
  try {
    const { plan, paymentId } = req.body; // plan: "monthly" | "yearly"
    const stall = await Stall.findOne({ owner: req.user._id });
    if (!stall) return res.status(404).json({ success: false, message: "No stall" });

    const nextBilling = new Date();
    if (plan === "yearly") nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    else nextBilling.setMonth(nextBilling.getMonth() + 1);

    stall.subscriptionStatus = "active";
    stall.subscriptionPlan   = plan;
    stall.subscriptionStart  = new Date();
    stall.nextBillingDate    = nextBilling;
    await stall.save();

    res.json({ success: true, stall, message: `Subscription activated (${plan})` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Shop Products ────────────────────────────────────────────────────────────

// GET  /api/plaza/shop/products
router.get("/shop/products", protect, async (req, res) => {
  try {
    const stall = await Stall.findOne({ owner: req.user._id });
    if (!stall) return res.status(404).json({ success: false, message: "No stall" });
    const products = await PlazaProduct.find({ stall: stall._id }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plaza/shop/products
router.post("/shop/products", protect, async (req, res) => {
  try {
    const stall = await Stall.findOne({ owner: req.user._id });
    if (!stall) return res.status(404).json({ success: false, message: "No stall" });
    if (!["trial","active"].includes(stall.subscriptionStatus))
      return res.status(403).json({ success: false, message: "Active subscription required" });

    const { name, description, price, originalPrice, category, stock, discount, videoUrl, tags, images } = req.body;
    if (!name || !price) return res.status(400).json({ success: false, message: "Name and price required" });

    const product = await PlazaProduct.create({
      stall:  stall._id,
      owner:  req.user._id,
      name, description, price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category:  category  || "General",
      stock:     Number(stock  || 0),
      discount:  Number(discount || 0),
      videoUrl:  videoUrl  || "",
      tags:      tags      || [],
      images:    Array.isArray(images) ? images : [],
    });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT  /api/plaza/shop/products/:id
router.put("/shop/products/:id", protect, async (req, res) => {
  try {
    const product = await PlazaProduct.findOne({ _id: req.params.id, owner: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const allowed = ["name","description","price","originalPrice","category","stock","discount","videoUrl","isActive","tags","images"];
    allowed.forEach(k => { if (req.body[k] !== undefined) product[k] = req.body[k]; });
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/plaza/shop/products/:id
router.delete("/shop/products/:id", protect, async (req, res) => {
  try {
    await PlazaProduct.deleteOne({ _id: req.params.id, owner: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Image Uploads ────────────────────────────────────────────────────────────

// POST /api/plaza/shop/upload/product-image  — upload one product image, returns {url, public_id}
router.post("/shop/upload/product-image", protect, uploadProductImg.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.json({ success: true, url: req.file.path, public_id: req.file.filename });
});

// DELETE /api/plaza/shop/upload/product-image  — delete image from Cloudinary by public_id
router.delete("/shop/upload/product-image", protect, async (req, res) => {
  try {
    const { public_id } = req.body;
    if (public_id) await cloudinary.uploader.destroy(public_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plaza/shop/upload/logo  — upload stall logo, auto-updates stall record
router.post("/shop/upload/logo", protect, uploadLogo.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  try {
    const stall = await Stall.findOne({ owner: req.user._id });
    if (stall) {
      if (stall.logo?.public_id) {
        await cloudinary.uploader.destroy(stall.logo.public_id).catch(() => {});
      }
      stall.logo = { url: req.file.path, public_id: req.file.filename };
      await stall.save();
    }
    res.json({ success: true, url: req.file.path, public_id: req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Stall Coupons ────────────────────────────────────────────────────────────

// GET  /api/plaza/shop/coupons
router.get("/shop/coupons", protect, async (req, res) => {
  try {
    const stall = await Stall.findOne({ owner: req.user._id });
    if (!stall) return res.status(404).json({ success: false, message: "No stall" });
    const coupons = await StallCoupon.find({ stall: stall._id });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plaza/shop/coupons
router.post("/shop/coupons", protect, async (req, res) => {
  try {
    const stall = await Stall.findOne({ owner: req.user._id });
    if (!stall) return res.status(404).json({ success: false, message: "No stall" });
    const { code, type, discount, minOrder, expiresAt } = req.body;
    const coupon = await StallCoupon.create({
      stall: stall._id, code: code.toUpperCase(), type, discount: Number(discount),
      minOrder: Number(minOrder || 0), expiresAt,
    });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/plaza/shop/coupons/:id
router.delete("/shop/coupons/:id", protect, async (req, res) => {
  try {
    const stall = await Stall.findOne({ owner: req.user._id });
    await StallCoupon.deleteOne({ _id: req.params.id, stall: stall._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plaza/coupons/validate
router.post("/coupons/validate", protect, async (req, res) => {
  try {
    const { code, stallId, subtotal } = req.body;
    const coupon = await StallCoupon.findOne({ stall: stallId, code: code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Invalid coupon" });
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      return res.status(400).json({ success: false, message: "Coupon expired" });
    if (subtotal < coupon.minOrder)
      return res.status(400).json({ success: false, message: `Min order ₹${coupon.minOrder}` });

    let discountAmount = 0;
    if (coupon.type === "percent") discountAmount = (subtotal * coupon.discount) / 100;
    else discountAmount = coupon.discount;
    discountAmount = Math.min(discountAmount, subtotal);

    res.json({ success: true, coupon, discountAmount: Math.round(discountAmount) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Bank Details ─────────────────────────────────────────────────────────────

// GET  /api/plaza/shop/bank
router.get("/shop/bank", protect, async (req, res) => {
  try {
    const bank = await BankDetail.findOne({ owner: req.user._id });
    res.json({ success: true, bank });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plaza/shop/bank
router.post("/shop/bank", protect, async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId } = req.body;
    if (!accountHolderName || !accountNumber || !ifscCode || !bankName)
      return res.status(400).json({ success: false, message: "All bank fields required" });

    const stall = await Stall.findOne({ owner: req.user._id });
    let bank = await BankDetail.findOne({ owner: req.user._id });
    if (bank) {
      Object.assign(bank, { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId, isVerified: false });
    } else {
      bank = new BankDetail({ owner: req.user._id, stall: stall?._id, accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId });
    }
    await bank.save();
    if (stall) { stall.bankDetailsAdded = true; await stall.save(); }
    res.json({ success: true, bank });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Wallet ──────────────────────────────────────────────────────────────────

// GET  /api/plaza/shop/wallet
router.get("/shop/wallet", protect, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    const transactions = await WalletTransaction.find({ wallet: wallet._id }).sort({ createdAt: -1 }).limit(50);
    const withdrawals  = await Withdrawal.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, wallet, transactions, withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plaza/shop/wallet/withdraw
router.post("/shop/wallet/withdraw", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < 100)
      return res.status(400).json({ success: false, message: "Minimum withdrawal ₹100" });

    const wallet = await Wallet.findOne({ owner: req.user._id });
    if (!wallet || wallet.balance < withdrawAmount)
      return res.status(400).json({ success: false, message: "Insufficient balance" });

    const bank = await BankDetail.findOne({ owner: req.user._id });
    if (!bank) return res.status(400).json({ success: false, message: "Add bank details first" });

    const processingFee = Math.round(withdrawAmount * 0.10); // 10%
    const netAmount     = withdrawAmount - processingFee;

    // Deduct from wallet
    wallet.balance        -= withdrawAmount;
    wallet.totalWithdrawn += withdrawAmount;
    await wallet.save();

    const withdrawal = await Withdrawal.create({
      owner:           req.user._id,
      wallet:          wallet._id,
      bankDetail:      bank._id,
      requestedAmount: withdrawAmount,
      processingFee,
      netAmount,
      bvCreditAmount:  processingFee,
      status:          "pending",
    });

    await WalletTransaction.create({
      wallet: wallet._id, owner: req.user._id,
      type:   "debit",
      amount: withdrawAmount,
      description: `Withdrawal request #${withdrawal._id}. Processing fee: ₹${processingFee}`,
      status: "pending",
      referenceId: withdrawal._id.toString(),
    });

    res.json({ success: true, withdrawal, message: `Withdrawal of ₹${netAmount} requested (₹${processingFee} fee deducted)` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Orders (Shop Owner view) ─────────────────────────────────────────────────

// GET  /api/plaza/shop/orders
router.get("/shop/orders", protect, async (req, res) => {
  try {
    const stall = await Stall.findOne({ owner: req.user._id });
    if (!stall) return res.status(404).json({ success: false, message: "No stall" });
    const orders = await PlazaOrder.find({ stall: stall._id }).populate("buyer","name email").sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT  /api/plaza/shop/orders/:id/status
router.put("/shop/orders/:id/status", protect, async (req, res) => {
  try {
    const stall = await Stall.findOne({ owner: req.user._id });
    const order = await PlazaOrder.findOne({ _id: req.params.id, stall: stall._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    order.status = req.body.status;
    await order.save();

    // Credit wallet when order is delivered
    if (req.body.status === "delivered" && order.isPaid) {
      const wallet = await getOrCreateWallet(req.user._id, stall._id);
      wallet.balance     += order.total;
      wallet.totalEarned += order.total;
      await wallet.save();
      await WalletTransaction.create({
        wallet: wallet._id, owner: req.user._id,
        type: "credit", amount: order.total,
        description: `Sale from order #${order._id}`,
        status: "completed", referenceId: order._id.toString(),
      });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Buyer Orders ─────────────────────────────────────────────────────────────

// POST /api/plaza/orders/create-payment  — create Razorpay order for plaza purchase
router.post("/orders/create-payment", protect, async (req, res) => {
  try {
    const { total } = req.body;
    if (!total || total <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId || !keyId.startsWith("rzp_"))
      return res.status(500).json({ success: false, message: "Payment gateway not configured" });
    const rzpOrder = await getRazorpay().orders.create({
      amount:   Math.round(total * 100),
      currency: "INR",
      receipt:  `plaza_${Date.now()}`,
    });
    res.json({ success: true, orderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, keyId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.error?.description || err.message });
  }
});

// POST /api/plaza/orders  — verify Razorpay payment and create plaza order
router.post("/orders", protect, async (req, res) => {
  try {
    const { stallId, items, shippingAddress, couponUsed,
            paymentId, paymentOrderId, paymentSignature } = req.body;
    if (!stallId || !items?.length) return res.status(400).json({ success: false, message: "Invalid order" });

    // ── Verify Razorpay signature ──────────────────────────────────────────────
    if (!paymentId || !paymentOrderId || !paymentSignature)
      return res.status(400).json({ success: false, message: "Payment details missing" });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${paymentOrderId}|${paymentId}`).digest("hex");
    if (expected !== paymentSignature)
      return res.status(400).json({ success: false, message: "Payment verification failed" });

    // ── Build order items & subtotal from DB (never trust client price) ────────
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await PlazaProduct.findById(item.productId);
      if (!product) continue;
      const price = product.price;
      subtotal += price * item.qty;
      orderItems.push({ product: product._id, name: product.name, price, qty: item.qty, image: product.images?.[0]?.url || "" });
    }

    // ── Coupon ────────────────────────────────────────────────────────────────
    let discountAmount = 0;
    if (couponUsed) {
      const coupon = await StallCoupon.findOne({ stall: stallId, code: couponUsed.toUpperCase(), active: true });
      if (coupon) {
        if (coupon.type === "percent") discountAmount = Math.round(subtotal * coupon.discount / 100);
        else discountAmount = Math.min(coupon.discount, subtotal);
        coupon.usedCount++;
        await coupon.save();
      }
    }

    const total = subtotal - discountAmount;
    const order = await PlazaOrder.create({
      buyer: req.user._id, stall: stallId,
      items: orderItems, subtotal, discountAmount, total,
      couponUsed, shippingAddress,
      paymentId, isPaid: true,
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET  /api/plaza/orders/my  — buyer's orders
router.get("/orders/my", protect, async (req, res) => {
  try {
    const orders = await PlazaOrder.find({ buyer: req.user._id })
      .populate("stall", "shopName logo")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Chat ─────────────────────────────────────────────────────────────────────

// GET  /api/plaza/chat/:stallId/:sessionId
router.get("/chat/:stallId/:sessionId", protect, async (req, res) => {
  try {
    const messages = await PlazaChat.find({
      stall: req.params.stallId,
      sessionId: req.params.sessionId,
    }).sort({ createdAt: 1 }).limit(100);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/plaza/chat/:stallId/:sessionId
router.post("/chat/:stallId/:sessionId", protect, async (req, res) => {
  try {
    const { messageType, content, productId, senderType } = req.body;
    const message = await PlazaChat.create({
      stall:       req.params.stallId,
      sessionId:   req.params.sessionId,
      sender:      req.user._id,
      senderName:  req.user.name,
      senderType:  senderType || "buyer",
      messageType: messageType || "text",
      content:     content || "",
      productId:   productId || null,
    });
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
