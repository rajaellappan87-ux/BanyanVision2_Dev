/**
 * BanyanVision — Frontend Logger
 * ─────────────────────────────
 * Captures errors, user interactions, and API issues.
 * Sends to backend /api/logs/frontend for storage in MongoDB.
 *
 * Usage:
 *   import log from "../utils/logger";
 *   log.info("User opened cart");
 *   log.error("Payment failed", { orderId }, err);
 *   log.userAction("add_to_cart", { productId, productName });
 */

import { API } from "../api";

// ── Queue for buffering logs before sending ────────────────
let _queue  = [];
let _timer  = null;
let _userId = null;
let _userEmail = null;

// ── Set user context (called after login) ─────────────────
export const setLogUser = (user) => {
  _userId    = user?._id  || user?.id || null;
  _userEmail = user?.email || null;
};

// ── Flush queue to backend every 5 seconds ────────────────
const flush = async () => {
  if (_queue.length === 0) return;
  const batch = [..._queue];
  _queue = [];
  try {
    // Send each log — backend /api/logs/frontend accepts one at a time
    for (const entry of batch) {
      await API.post("/logs/frontend", entry).catch(() => {});
    }
  } catch {}
};

const scheduleFlush = () => {
  if (_timer) return;
  _timer = setTimeout(() => {
    _timer = null;
    flush();
  }, 5000);
};

// ── Core write ────────────────────────────────────────────
const write = (level, category, message, details, err) => {
  // Always log to console in development
  if (process.env.NODE_ENV !== "production") {
    const fn = level === "error" || level === "fatal" ? console.error
             : level === "warn"  ? console.warn
             : console.log;
    fn(`[${level.toUpperCase()}][${category}]`, message, details || "", err || "");
  }

  const entry = {
    level,
    category,
    message: String(message).substring(0, 500),
    details,
    stack:   err?.stack?.substring(0, 2000) || null,
    path:    window.location.pathname,
    userId:    _userId,
    userEmail: _userEmail,
  };

  _queue.push(entry);
  scheduleFlush();

  // Fatal errors flush immediately
  if (level === "fatal" || level === "error") {
    clearTimeout(_timer);
    _timer = null;
    flush();
  }
};

// ── Public API ────────────────────────────────────────────
const log = {
  info:   (message, details)       => write("info",  "frontend", message, details, null),
  warn:   (message, details)       => write("warn",  "frontend", message, details, null),
  error:  (message, details, err)  => write("error", "frontend", message, details, err),
  fatal:  (message, details, err)  => write("fatal", "frontend", message, details, err),

  // Category-specific shortcuts
  auth:    (message, details, err) => write(err ? "error" : "info", "auth",    message, details, err),
  payment: (message, details, err) => write(err ? "error" : "info", "payment", message, details, err),
  api:     (message, details, err) => write(err ? "error" : "warn", "api",     message, details, err),

  // User interaction tracker
  userAction: (action, details) => write("info", "frontend", `User: ${action}`, details, null),

  // Page navigation
  page: (pageName) => write("info", "frontend", `Page: ${pageName}`, { url: window.location.href }, null),

  // Set logged-in user context
  setUser: setLogUser,
};

// ── Global error capture ──────────────────────────────────
// Catches unhandled JS errors and promise rejections
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    write("error", "frontend", event.message || "Unhandled error", {
      filename: event.filename,
      line:     event.lineno,
      col:      event.colno,
    }, event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    write("error", "frontend", "Unhandled promise rejection", {
      reason: String(event.reason),
    }, event.reason instanceof Error ? event.reason : null);
  });
}

export default log;
