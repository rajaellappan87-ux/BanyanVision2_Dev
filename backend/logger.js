/**
 * BanyanVision — Central Logger
 * ─────────────────────────────
 * Writes to:
 *   1. MongoDB Log collection (30-day auto-purge via TTL index)
 *   2. Console (colour-coded, always)
 *
 * Usage:
 *   const log = require("./logger");
 *   log.info("app",   "Server started", { port: 5000 });
 *   log.error("db",   "Connection failed", { uri: "..." }, err);
 *   log.warn("auth",  "Invalid token attempt", { ip });
 *   log.fatal("system","Out of memory", null, err);
 *   log.api(req, res, durationMs);            // HTTP request log
 *   log.payment("Razorpay order created", {}); // payment-specific
 *   log.mail("Email sent", { to });           // email-specific
 */

let Log = null; // lazy-loaded after DB connects to avoid circular dep

const loadModel = () => {
  if (!Log) {
    try { Log = require("./models").Log; } catch {}
  }
  return Log;
};

// ── Console colours ───────────────────────────────────────
const COLORS = {
  reset:  "\x1b[0m",
  red:    "\x1b[31m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  magenta:"\x1b[35m",
  white:  "\x1b[37m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
};

const LEVEL_COLOR = {
  info:  COLORS.cyan,
  warn:  COLORS.yellow,
  error: COLORS.red,
  fatal: COLORS.bold + COLORS.red,
  debug: COLORS.dim,
};

const LEVEL_EMOJI = {
  info:  "ℹ️ ",
  warn:  "⚠️ ",
  error: "❌",
  fatal: "💀",
  debug: "🐛",
};

// ── Sanitise sensitive values ──────────────────────────────
const SENSITIVE_KEYS = ["password","secret","pass","token","authorization","key","auth"];
const sanitise = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const low = k.toLowerCase();
    if (SENSITIVE_KEYS.some(s => low.includes(s))) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      out[k] = sanitise(v);
    } else {
      out[k] = v;
    }
  }
  return out;
};

// ── Write to console ──────────────────────────────────────
const toConsole = (level, category, message, details, err) => {
  const ts   = new Date().toISOString();
  const col  = LEVEL_COLOR[level] || COLORS.white;
  const em   = LEVEL_EMOJI[level] || "  ";
  const cat  = `[${category.toUpperCase()}]`.padEnd(12);
  const lvl  = `[${level.toUpperCase()}]`.padEnd(8);

  const line = `${COLORS.dim}${ts}${COLORS.reset} ${col}${em} ${lvl}${COLORS.reset} ${COLORS.bold}${cat}${COLORS.reset} ${message}`;
  console.log(line);

  if (details && Object.keys(details).length > 0) {
    console.log(`${COLORS.dim}         ↳`, JSON.stringify(sanitise(details)), COLORS.reset);
  }
  if (err?.stack) {
    console.error(`${COLORS.red}         ↳ STACK: ${err.stack.split("\n").slice(0,4).join(" | ")}${COLORS.reset}`);
  }
};

// ── Write to MongoDB (non-blocking) ───────────────────────
const toDB = (entry) => {
  const Model = loadModel();
  if (!Model) return; // DB not connected yet
  Model.create(entry).catch(() => {}); // never throw — logging must not crash app
};

// ── Core log function ─────────────────────────────────────
const write = (level, category, message, details = null, err = null, extra = {}) => {
  const sanitised = sanitise(details);
  toConsole(level, category, message, sanitised, err);

  toDB({
    level,
    category,
    message: String(message).substring(0, 500),
    details: sanitised,
    stack:   err?.stack?.substring(0, 2000) || null,
    env:     process.env.NODE_ENV || "development",
    source:  "backend",
    ...extra,
  });
};

// ── Public API ────────────────────────────────────────────
const logger = {

  info:  (category, message, details, extra)        => write("info",  category, message, details, null, extra),
  warn:  (category, message, details, extra)        => write("warn",  category, message, details, null, extra),
  error: (category, message, details, err, extra)   => write("error", category, message, details, err,  extra),
  fatal: (category, message, details, err, extra)   => write("fatal", category, message, details, err,  extra),
  debug: (category, message, details, extra)        => {
    if (process.env.NODE_ENV !== "production") write("debug", category, message, details, null, extra);
  },

  // ── HTTP request logger ──────────────────────────────────
  api: (req, res, duration) => {
    const level = res.statusCode >= 500 ? "error"
                : res.statusCode >= 400 ? "warn"
                : "info";
    write(level, "api", `${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`, {
      query:  req.query,
      body:   sanitise(req.body),
    }, null, {
      method:     req.method,
      path:       req.path,
      statusCode: res.statusCode,
      duration,
      ip:         req.ip || req.headers["x-forwarded-for"],
      userId:     req.user?._id || null,
      userEmail:  req.user?.email || null,
    });
  },

  // ── Payment logger ───────────────────────────────────────
  payment: (message, details, err) =>
    write(err ? "error" : "info", "payment", message, details, err),

  // ── Email logger ─────────────────────────────────────────
  mail: (message, details, err) =>
    write(err ? "error" : "info", "email", message, details, err),

  // ── DB logger ────────────────────────────────────────────
  db: (message, details, err) =>
    write(err ? "error" : "info", "db", message, details, err),

  // ── Auth logger ──────────────────────────────────────────
  auth: (message, details, err) =>
    write(err ? "warn" : "info", "auth", message, details, err),

  // ── Security logger ──────────────────────────────────────
  security: (message, details) =>
    write("warn", "security", message, details),

  // ── Environment logger (logs env var status safely) ──────
  env: () => {
    const vars = {
      NODE_ENV:              process.env.NODE_ENV,
      PORT:                  process.env.PORT,
      MONGO_URI:             process.env.MONGO_URI ? "✅ set" : "❌ MISSING",
      JWT_SECRET:            process.env.JWT_SECRET ? "✅ set" : "❌ MISSING",
      RAZORPAY_KEY_ID:       process.env.RAZORPAY_KEY_ID?.startsWith("rzp_") ? `✅ ${process.env.RAZORPAY_KEY_ID.startsWith("rzp_live") ? "LIVE" : "TEST"} mode` : "❌ MISSING/INVALID",
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "✅ set" : "❌ MISSING",
      SMTP_HOST:             process.env.SMTP_HOST || "❌ MISSING",
      SMTP_USER:             process.env.SMTP_USER ? "✅ set" : "❌ MISSING",
      CLIENT_URL:            process.env.CLIENT_URL || "(localhost:3000)",
    };
    write("info", "system", "Environment configuration", vars);
    return vars;
  },

  // ── Frontend log receiver ─────────────────────────────────
  frontend: (entry) => {
    const { level="error", category="frontend", message, details, stack, userId, userEmail, path: fePath } = entry;
    toDB({
      level:     ["info","warn","error","fatal","debug"].includes(level) ? level : "error",
      category:  ["app","auth","payment","frontend","api"].includes(category) ? category : "frontend",
      message:   String(message || "Unknown frontend error").substring(0, 500),
      details:   sanitise(details),
      stack:     String(stack || "").substring(0, 2000) || null,
      userId:    userId || null,
      userEmail: userEmail || null,
      path:      fePath || null,
      source:    "frontend",
      env:       process.env.NODE_ENV || "development",
    });
    // Also print to console
    toConsole(level, `FE:${category}`, message, details, stack ? { stack } : null);
  },
};

module.exports = logger;
