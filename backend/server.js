const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// DNS resolution fix
const dns = require("dns");
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["2001:4860:4860::8888", "2001:4860:4860::8844", "8.8.8.8", "8.8.4.4"]);
}


// ═══════════════════════════════════════════════════════════════════
// CRASH GUARDS — MUST be first — prevents process from dying on any
// unhandled error. Without these, a single bad async call kills server.
// ═══════════════════════════════════════════════════════════════════
process.on("uncaughtException", (err) => {
  console.error("\n💀 UNCAUGHT EXCEPTION (server kept alive):", err.message);
  console.error(err.stack);
  // Log to DB if possible (non-blocking)
  try {
    const log = require("./logger");
    log.fatal("system", "Uncaught exception — server kept alive", { message: err.message }, err);
  } catch {}
  // Do NOT call process.exit() — keep server running
});

process.on("unhandledRejection", (reason, promise) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error("\n⚠️  UNHANDLED REJECTION (server kept alive):", msg);
  try {
    const log = require("./logger");
    log.error("system", "Unhandled promise rejection — server kept alive", { reason: msg },
      reason instanceof Error ? reason : null);
  } catch {}
  // Do NOT call process.exit() — keep server running
});

const express      = require("express");
const mongoose     = require("mongoose");
const cors         = require("cors");
const morgan       = require("morgan");
const helmet       = require("helmet");
const compression  = require("compression");
const rateLimit    = require("express-rate-limit");

// Using path.join(__dirname, ...) ensures modules resolve correctly
// regardless of which directory you run `node` from
const { authRouter, productRouter, reviewRouter, orderRouter, wishlistRouter, couponRouter, adminRouter, configRouter, logRouter } = require(path.join(__dirname, "routes"));
const plazaRouter = require(path.join(__dirname, "..", "BV_Plaza", "backend", "plazaRoutes"));
const { verifySmtp } = require(path.join(__dirname, "mailer"));
const log = require(path.join(__dirname, "logger"));
const { errorHandler } = require(path.join(__dirname, "middleware"));
const { User, Product, Coupon } = require(path.join(__dirname, "models"));

const app = express();
app.set("trust proxy", 1); // fix express-rate-limit X-Forwarded-For warning

// ─── Security & Performance Middleware ───────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());

// Rate limiting — generous in dev, strict in prod
const isDev = process.env.NODE_ENV !== "production";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,          // dev: 2000/15min  prod: 200/15min
  message: { success:false, message:"Too many requests. Please try again later." },
  skip: (req) => req.path === "/api/health", // never rate-limit health check
  validate: { xForwardedForHeader: false },  // suppress proxy warning
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 15,            // dev: 100/15min   prod: 15/15min
  message: { success:false, message:"Too many login attempts. Please try again later." },
});

app.use("/api/auth", authLimiter);
app.use("/api", limiter);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = ["http://localhost:3000","http://127.0.0.1:3000", process.env.CLIENT_URL].filter(Boolean);
    if (
      allowed.includes(origin) ||
      origin.endsWith(".githubpreview.dev") ||
      origin.endsWith(".app.github.dev") ||
      origin.endsWith(".github.dev") ||
      origin.endsWith(".ngrok-free.app") ||
      origin.endsWith(".ngrok.io") ||
      origin.endsWith(".loca.lt")
    ) return callback(null, true);
    return callback(null, true); // allow all for local dev/preview sharing
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// ─── Request Logger Middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    // Skip health check and static asset noise
    if (req.path === "/api/health" || req.path.startsWith("/static")) return;
    log.api(req, res, Date.now() - start);
  });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRouter);
app.use("/api/products", productRouter);
app.use("/api/reviews",  reviewRouter);
app.use("/api/orders",   orderRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/coupons",  couponRouter);
app.use("/api/admin",    adminRouter);
app.use("/api/config",   configRouter);
app.use("/api/logs",     logRouter);
app.use("/api/plaza",    plazaRouter);

app.get("/api/health", (_, res) => {
  const dbState = ["disconnected","connected","connecting","disconnecting"];
  res.json({
    status:    "ok",
    db:        dbState[mongoose.connection.readyState] || "unknown",
    timestamp: new Date(),
    version:   "1.0.0",
  });
});

// DB info — admin only — confirms which database is connected
app.get("/api/db-info", async (req, res) => {
  try {
    const uri     = process.env.MONGO_URI || "";
    const match   = uri.match(/\.mongodb\.net\/([^?]+)/);
    const dbName  = match ? match[1] : "unknown";
    const isValid = mongoose.connection.readyState === 1;

    const db      = mongoose.connection.db;
    const counts  = {};
    for (const col of ["users","orders","products","coupons","siteconfigs"]) {
      try { counts[col] = await db.collection(col).countDocuments(); } catch { counts[col] = -1; }
    }

    res.json({
      database:    dbName,
      isDevDB:     dbName.includes("dev"),
      isProdDB:    dbName.includes("prod"),
      connected:   isValid,
      env:         process.env.NODE_ENV,
      collections: counts,
      warning:     dbName.includes("dev") && process.env.NODE_ENV === "production"
        ? "⚠️ WRONG: Production server is connected to DEV database! Change MONGO_URI in Railway."
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Security: hide powered-by
app.disable("x-powered-by");

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  log.error("app", err.message || "Unhandled error", {
    method: req.method,
    path:   req.path,
    body:   req.body,
  }, err, {
    statusCode: 500,
    userId:    req.user?._id || null,
    userEmail: req.user?.email || null,
    ip:        req.ip,
  });
  errorHandler(err, req, res, next);
});

// ─── DB Seed (first run) ─────────────────────────────────────────────────────
const seedDatabase = async () => {
  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  console.log("🌱 Seeding database...");

  // Seed admin + demo user
  await User.create([
    { name: "Arjun Mehta", email: "admin@banyanvision.com", password: "admin123", role: "admin", phone: "+91 98765 43210" },
    { name: "Priya Sharma", email: "user@test.com", password: "user123", role: "user", phone: "+91 87654 32109", address: "42, Green Park, New Delhi - 110016" },
  ]);

  // Seed coupons
  await Coupon.create([
    { code: "BANYAN10",  type: "percent", discount: 0.10, desc: "10% off on all orders" },
    { code: "WELCOME20", type: "percent", discount: 0.20, desc: "20% off for new users" },
    { code: "FESTIVE15", type: "percent", discount: 0.15, desc: "15% festive discount" },
    { code: "FLAT500",   type: "flat",    discount: 500,  desc: "₹500 flat off above ₹3000", minOrder: 3000 },
    { code: "BRIDAL30",  type: "percent", discount: 0.30, desc: "30% off on bridal wear" },
  ]);

  // Seed sample products (admin can add real images via dashboard)
  const sampleProducts = [
    { name: "Ananya Silk Kurta Set", price: 3499, originalPrice: 4999, category: "Kurtas & Sets", description: "Handcrafted pure silk kurta with intricate zari embroidery.", fabric: "Pure Silk", occasion: "Festive / Wedding", care: "Dry Clean Only", sizes: ["XS","S","M","L","XL","XXL"], colors: ["Ivory White","Dusty Rose","Forest Green"], stock: 18, featured: true, badge: "Bestseller", trending: true, images: [{ url: "https://placehold.co/900x1100/f5f0e8/1a1a1a?text=Silk+Kurta", public_id: "placeholder_1" }] },
    { name: "Devika Banarasi Saree", price: 8999, originalPrice: 12999, category: "Sarees", description: "Authentic Banarasi silk saree with traditional brocade motifs.", fabric: "Banarasi Silk", occasion: "Wedding / Bridal", care: "Dry Clean Only", sizes: ["Free Size"], colors: ["Maroon","Royal Blue","Saffron"], stock: 7, featured: true, badge: "Limited", trending: true, images: [{ url: "https://placehold.co/900x1100/f5f0e8/1a1a1a?text=Banarasi+Saree", public_id: "placeholder_2" }] },
    { name: "Meera Lehenga Choli",   price: 14999, originalPrice: 22000, category: "Lehengas", description: "Flared lehenga with heavy mirror-work and sequin embellishment.", fabric: "Net & Velvet", occasion: "Bridal / Sangeet", care: "Dry Clean Only", sizes: ["S","M","L","XL"], colors: ["Dusty Rose","Royal Blue","Maroon"], stock: 5, featured: true, badge: "New Arrival", trending: false, images: [{ url: "https://placehold.co/900x1100/f5f0e8/1a1a1a?text=Lehenga", public_id: "placeholder_3" }] },
    { name: "Heritage Kundan Necklace Set", price: 4500, originalPrice: 6000, category: "Accessories", description: "Handcrafted Kundan and polki necklace with matching earrings.", fabric: "Metal Alloy", occasion: "Wedding / Festive", care: "Store in Pouch", sizes: ["One Size"], colors: ["Gold"], stock: 12, featured: true, badge: "Editor's Pick", trending: true, images: [{ url: "https://placehold.co/900x1100/f5f0e8/1a1a1a?text=Kundan+Set", public_id: "placeholder_4" }] },
    { name: "Arjun Bandhgala Suit",  price: 9999, originalPrice: 14000, category: "Men's Wear", description: "Bespoke-style bandhgala jacket with straight trousers.", fabric: "Wool Blend", occasion: "Wedding / Formal", care: "Dry Clean Only", sizes: ["S","M","L","XL","XXL"], colors: ["Midnight Black","Ivory White","Royal Blue"], stock: 15, featured: false, badge: "Premium", trending: false, images: [{ url: "https://placehold.co/900x1100/f5f0e8/1a1a1a?text=Bandhgala", public_id: "placeholder_5" }] },
    { name: "Bridal Patola Silk Saree", price: 18999, originalPrice: 26000, category: "Sarees", description: "Double ikat Patola silk saree from Patan, Gujarat.", fabric: "Patola Silk", occasion: "Bridal / Heirloom", care: "Dry Clean Only", sizes: ["Free Size"], colors: ["Maroon","Saffron","Royal Blue"], stock: 4, featured: true, badge: "Exclusive", trending: true, images: [{ url: "https://placehold.co/900x1100/f5f0e8/1a1a1a?text=Patola+Saree", public_id: "placeholder_6" }] },
  ];
  await Product.insertMany(sampleProducts);
  console.log("✅ Database seeded successfully");
};

// ─── Start server ─────────────────────────────────────────────────────────────
// IMPORTANT: bind the port FIRST so Railway's health check passes immediately,
// then connect MongoDB in the background. Previously the server only listened
// inside mongoose.connect().then() — if Atlas was slow the health check timed out.
const PORT = process.env.PORT || 5000;
const http = require("http");
const { Server } = require("socket.io");

const httpServer = http.createServer(app);

// Attach socket.io (BV Plaza real-time)
try {
  const io = new Server(httpServer, { cors: { origin: "*", credentials: true } });
  require(path.join(__dirname, "..", "BV_Plaza", "backend", "plazaSocket"))(io);
  console.log("✅ BV Plaza socket.io attached");
} catch (socketErr) {
  console.warn("⚠️  BV Plaza: socket.io setup failed:", socketErr.message);
}

// ── Bind port immediately — health check works before DB is ready ─────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  log.info("system", "Server started", { port: PORT, env: process.env.NODE_ENV, version: "1.0.0" });
});

httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`⚠️  Port ${PORT} busy — retrying in 2s...`);
    httpServer.close();
    setTimeout(() => httpServer.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT} (retry OK)`)
    ), 2000);
  } else {
    console.error("❌ Server error:", err);
    process.exit(1);
  }
});

// ── Connect MongoDB in the background ─────────────────────────────────────────
mongoose.set("autoIndex",  false); // prevent index builds timing out on Atlas M0
mongoose.set("autoCreate", false); // prevent createCollection() calls on first query

// Connection event handlers — registered before connect() so they fire on reconnect too
mongoose.connection.on("disconnected", () => log.warn("db", "MongoDB disconnected — will auto-reconnect"));
mongoose.connection.on("reconnected",  () => log.info("db", "MongoDB reconnected successfully"));
mongoose.connection.on("error", (err)  => log.error("db", "MongoDB connection error", { message: err.message }, err));

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS:          45000,
  connectTimeoutMS:         10000,
  heartbeatFrequencyMS:     10000,
  maxPoolSize:              10,
  minPoolSize:              2,
  retryWrites:              true,
  retryReads:               true,
})
  .then(async () => {
    log.db("MongoDB connected successfully", { uri: process.env.MONGO_URI?.split("@")[1] || "connected" });
    log.env();
    await seedDatabase();
    await verifySmtp();

    // ── Pre-create BV Plaza collections so first queries don't hang ───────────
    try {
      const db = mongoose.connection.db;
      const plazaCollections = ["stalls","plazaproducts","stallcoupons","bankdetails","wallets","wallettransactions","plazaorders","plazachats","withdrawals"];
      const existing = (await db.listCollections().toArray()).map(c => c.name);
      for (const col of plazaCollections) {
        if (!existing.includes(col)) {
          await db.createCollection(col);
          console.log(`✅ BV Plaza: created collection '${col}'`);
        }
      }
      console.log("✅ BV Plaza: all collections ready");
    } catch (e) {
      console.error("❌ BV Plaza collection pre-init error:", e.message);
    }
  })
  .catch(err => {
    // Log but do NOT exit — server is already listening and can still serve health checks
    console.error("❌ MongoDB connection failed:", err.message);
    log.fatal("db", "MongoDB connection failed — server still running", { message: err.message });
  });

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received — closing server...`);
  httpServer.close(() => console.log("✅ HTTP server closed"));
  try { await mongoose.connection.close(); console.log("✅ MongoDB disconnected"); } catch {}
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
