const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express      = require("express");
const mongoose     = require("mongoose");
const cors         = require("cors");
const morgan       = require("morgan");
const helmet       = require("helmet");
const compression  = require("compression");
const rateLimit    = require("express-rate-limit");

// Using path.join(__dirname, ...) ensures modules resolve correctly
// regardless of which directory you run `node` from
const { authRouter, productRouter, reviewRouter, orderRouter, wishlistRouter, couponRouter, adminRouter, configRouter } = require(path.join(__dirname, "routes"));
const { verifySmtp } = require(path.join(__dirname, "mailer"));
const { errorHandler } = require(path.join(__dirname, "middleware"));
const { User, Product, Coupon } = require(path.join(__dirname, "models"));

const app = express();

// ─── Security & Performance Middleware ───────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({ windowMs: 15*60*1000, max: 100, message: { success:false, message:"Too many requests. Please try again later." } });
// Stricter limit for auth routes — 10 attempts per 15 min
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, message: { success:false, message:"Too many login attempts. Please try again later." } });

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

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRouter);
app.use("/api/products", productRouter);
app.use("/api/reviews",  reviewRouter);
app.use("/api/orders",   orderRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/coupons",  couponRouter);
app.use("/api/admin",    adminRouter);
app.use("/api/config",   configRouter);

app.get("/api/health", (_, res) => res.json({ status: "ok", timestamp: new Date(), version: "1.0.0" }));

// Security: hide powered-by
app.disable("x-powered-by");

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

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
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    await seedDatabase();
    await verifySmtp(); // verify SMTP on startup

    const server = app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );

    // ── Handle port already in use (EADDRINUSE) ──────────────────────────────
    // Happens on Windows when nodemon restarts before OS releases the port.
    // Wait 2 seconds and retry once — almost always resolves it.
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`⚠️  Port ${PORT} busy — retrying in 2s...`);
        server.close();
        setTimeout(() => {
          app.listen(PORT, () =>
            console.log(`🚀 Server running on port ${PORT} (retry OK)`)
          );
        }, 2000);
      } else {
        console.error("❌ Server error:", err);
        process.exit(1);
      }
    });

    // ── Graceful shutdown — release port cleanly on Ctrl+C or nodemon restart
    const shutdown = async (signal) => {
      console.log(`
🛑 ${signal} received — closing server...`);
      server.close(() => console.log("✅ Server closed cleanly"));
      try {
        await mongoose.connection.close(); // Mongoose 8.x — no callback
        console.log("✅ MongoDB disconnected");
      } catch {}
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
  })
  .catch(err => { console.error("❌ MongoDB connection error:", err); process.exit(1); });
