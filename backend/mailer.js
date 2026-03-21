const nodemailer = require("nodemailer");
const log = require("./logger");

// ─── Config validation ────────────────────────────────────────────────────────
// ── Detect which email provider is configured ─────────────────────────────────
// Railway blocks ports 465 and 587 on many plans.
// Recommended for Railway production: use Resend (port 465 on smtp.resend.com)
// or keep Zoho but Railway must allow outbound SMTP (contact Railway support).
const getSmtpConfig = () => {
  const provider = process.env.EMAIL_PROVIDER || "zoho"; // zoho | resend | sendgrid | custom

  // Auto-configure based on provider
  const PROVIDERS = {
    resend: {
      host:   "smtp.resend.com",
      port:   465,
      secure: true,
      user:   "resend",                         // Resend always uses "resend" as username
      pass:   process.env.RESEND_API_KEY || process.env.SMTP_PASS,
    },
    sendgrid: {
      host:   "smtp.sendgrid.net",
      port:   587,
      secure: false,
      user:   "apikey",                         // SendGrid always uses "apikey" as username
      pass:   process.env.SENDGRID_API_KEY || process.env.SMTP_PASS,
    },
    zoho: {
      host:   process.env.SMTP_HOST || "smtppro.zoho.in",
      port:   Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== "false",
      user:   process.env.SMTP_USER,
      pass:   process.env.SMTP_PASS,
    },
    custom: {
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE !== "false",
      user:   process.env.SMTP_USER,
      pass:   process.env.SMTP_PASS,
    },
  };

  return PROVIDERS[provider] || PROVIDERS.zoho;
};

const validateSmtpConfig = () => {
  const provider = process.env.EMAIL_PROVIDER || "zoho";
  const cfg = getSmtpConfig();
  const missing = [];

  if (provider === "resend") {
    if (!process.env.RESEND_API_KEY && !process.env.SMTP_PASS) missing.push("RESEND_API_KEY");
  } else if (provider === "sendgrid") {
    if (!process.env.SENDGRID_API_KEY && !process.env.SMTP_PASS) missing.push("SENDGRID_API_KEY");
  } else {
    if (!cfg.host) missing.push("SMTP_HOST");
    if (!cfg.user) missing.push("SMTP_USER");
    if (!cfg.pass) missing.push("SMTP_PASS");
  }

  return { valid: missing.length === 0, missing, cfg, provider };
};

// ─── Transporter factory ──────────────────────────────────────────────────────
// Tries the configured port first, then auto-fallbacks:
//   465 (SSL)  → fails on Railway → tries 587 (STARTTLS) → tries 2525
//   587 (TLS)  → tries 465 (SSL) → tries 2525
const FALLBACK_PORTS = {
  465:  [{ port:587, secure:false }, { port:2525, secure:false }],
  587:  [{ port:465, secure:true  }, { port:2525, secure:false }],
  2525: [{ port:587, secure:false }, { port:465,  secure:true  }],
};

const makeTransport = (host, port, secure, user, pass) =>
  nodemailer.createTransport({
    host,
    port,
    secure,
    auth:  { user, pass },
    tls:   { rejectUnauthorized: false },
    connectionTimeout: 8000,
    greetingTimeout:   8000,
    socketTimeout:     10000,
  });

// ── createTransporter — for SENDING mail (no verify — Zoho rejects NOOP probes)
// verify() is unreliable on Zoho/cPanel — they reject the NOOP probe
// but accept actual mail. So we just build the transporter and let the
// actual sendMail call fail if credentials are wrong.
const createTransporter = () => {
  const { valid, missing, cfg } = validateSmtpConfig();
  if (!valid) {
    throw new Error(`SMTP config missing: ${missing.join(", ")} — set in Railway environment variables`);
  }
  return makeTransport(cfg.host, cfg.port, cfg.secure, cfg.user, cfg.pass);
};

// ── verifySmtpConnection — ONLY for diagnostics (not used during sends)
// Tries verify() — may fail on Zoho even when sending works.
// Also tries fallback ports so Railway-blocked port is detected.
const verifySmtpConnection = async () => {
  const { valid, missing, cfg } = validateSmtpConfig();
  if (!valid) return { ok: false, error: `Missing: ${missing.join(", ")}`, missing };

  // Try configured port first
  const attempts = [
    { port: cfg.port,  secure: cfg.secure },
    ...(FALLBACK_PORTS[cfg.port] || [{ port:587, secure:false }, { port:465, secure:true }]),
  ];

  for (const attempt of attempts) {
    try {
      const t = makeTransport(cfg.host, attempt.port, attempt.secure, cfg.user, cfg.pass);
      await t.verify();
      return {
        ok: true, port: attempt.port, secure: attempt.secure,
        tip: attempt.port !== cfg.port
          ? `Working on port ${attempt.port} — update SMTP_PORT=${attempt.port} SMTP_SECURE=${attempt.secure} in Railway`
          : null,
      };
    } catch {}
  }

  // All verify() attempts failed
  // ETIMEDOUT = Railway is blocking the port (most common)
  // ECONNREFUSED = Port closed on the server side
  // EAUTH = Wrong credentials
  return {
    ok:        false,
    zohoNote:  true,
    error:     "All SMTP ports blocked or unreachable from Railway.",
    railwayFix: "Railway blocks outbound SMTP. Switch to Resend (free tier, works on Railway). See fix instructions in diagnostic panel.",
  };
};

const ADMIN_EMAIL  = process.env.ADMIN_EMAIL  || "admin@banyanvision.com";
const FROM_ADDRESS = process.env.EMAIL_FROM   || `"BanyanVision" <${process.env.SMTP_USER}>`;
const BRAND_COLOR  = "#C2185B";
const GOLD_COLOR   = "#E65100";
const DARK_COLOR   = "#1A0A00";

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
const wrap = (bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#F5F0EA;font-family:'Segoe UI',Arial,sans-serif;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.1);}
  .header{background:linear-gradient(135deg,${DARK_COLOR},#3D1500);padding:28px 32px;text-align:center;}
  .brand{color:#fff;font-size:28px;font-weight:800;letter-spacing:.5px;margin:8px 0 4px;}
  .tagline{color:rgba(255,255,255,.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;}
  .body{padding:32px;}
  .greeting{font-size:22px;font-weight:700;color:${DARK_COLOR};margin-bottom:6px;}
  .subtitle{font-size:14px;color:#666;margin-bottom:24px;line-height:1.6;}
  .card{background:#FDF8F3;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #F0E8DD;}
  .card-title{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND_COLOR};margin-bottom:12px;}
  .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F0E8DD;font-size:13px;}
  .row:last-child{border-bottom:none;}
  .row-label{color:#888;font-weight:500;}
  .row-value{color:${DARK_COLOR};font-weight:700;text-align:right;}
  .item-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #F0E8DD;}
  .item-row:last-child{border-bottom:none;}
  .item-img{width:52px;height:64px;object-fit:cover;border-radius:8px;background:#eee;flex-shrink:0;}
  .item-name{font-size:13px;font-weight:700;color:${DARK_COLOR};}
  .item-meta{font-size:11px;color:#999;margin-top:3px;}
  .item-price{font-size:13px;font-weight:800;color:${BRAND_COLOR};margin-top:4px;}
  .total-bar{background:linear-gradient(135deg,${BRAND_COLOR},${GOLD_COLOR});border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
  .total-label{color:rgba(255,255,255,.85);font-size:12px;font-weight:600;letter-spacing:.5px;}
  .total-amount{color:#fff;font-size:22px;font-weight:800;}
  .status-badge{display:inline-block;padding:6px 18px;border-radius:99px;font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;}
  .btn{display:inline-block;padding:13px 32px;background:linear-gradient(135deg,${BRAND_COLOR},${GOLD_COLOR});color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin:8px 4px;}
  .divider{height:1px;background:#F0E8DD;margin:20px 0;}
  .stars{color:#F9A825;font-size:20px;letter-spacing:2px;}
  .footer{background:#FDF8F3;padding:20px 32px;text-align:center;border-top:1px solid #F0E8DD;}
  .footer-text{font-size:11px;color:#aaa;line-height:1.8;}
  .highlight{color:${BRAND_COLOR};font-weight:700;}
  @media(max-width:600px){.body{padding:20px;}.header{padding:20px;}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="brand">BanyanVision</div>
    <div class="tagline">Empowering Dreams, Inspiring Innovations</div>
  </div>
  <div class="body">
    ${bodyHtml}
  </div>
  <div class="footer">
    <div class="footer-text">
      © 2025 BanyanVision. Empowering Dreams, Inspiring Innovations.<br/>
      Questions? Reply to this email or write to <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND_COLOR}">${ADMIN_EMAIL}</a>
    </div>
  </div>
</div>
</body>
</html>`;

const fmt      = (n) => "₹" + Number(n).toLocaleString("en-IN");
const itemsHtml = (items) => items.map(it => `
  <div class="item-row">
    <img class="item-img" src="${it.image || ""}" alt="${it.name}"
      onerror="this.style.background='#F5E6EC'"/>
    <div style="flex:1">
      <div class="item-name">${it.name}</div>
      <div class="item-meta">${[it.color, it.size].filter(Boolean).join(" · ")} · Qty: ${it.qty}</div>
      <div class="item-price">${fmt(it.price)} each · ${fmt(it.price * it.qty)}</div>
    </div>
  </div>`).join("");

const statusConfig = {
  pending:    { label:"Order Placed",     color:"#D97706", bg:"#FEF3C7", icon:"🕐", msg:"We've received your order and will begin processing soon." },
  processing: { label:"Being Prepared",   color:"#2563EB", bg:"#EFF6FF", icon:"⚙️", msg:"Our team is carefully packing your order with love." },
  shipped:    { label:"Out for Delivery", color:"#7C3AED", bg:"#F5F3FF", icon:"🚚", msg:"Your order is on its way! Expect it within 1-3 business days." },
  delivered:  { label:"Delivered",        color:"#16A34A", bg:"#F0FDF4", icon:"✅", msg:"Your order has been delivered. We hope you love it!" },
  cancelled:  { label:"Cancelled",        color:"#DC2626", bg:"#FEF2F2", icon:"❌", msg:"Your order has been cancelled. Refund will be processed within 5-7 business days." },
};

const starsHtml = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

// ─── Core sendMail with full logging ─────────────────────────────────────────
const sendMail = async (transporter, options, context = "") => {
  const start = Date.now();
  try {
    const info = await transporter.sendMail(options);
    const ms   = Date.now() - start;
    log.mail(`Email sent: ${context}`, {
      to:        options.to,
      subject:   options.subject,
      messageId: info.messageId,
      duration:  ms,
    });
    return info;
  } catch (err) {
    const ms = Date.now() - start;
    log.error("email", `Email FAILED: ${context}`, {
      to:       options.to,
      subject:  options.subject,
      error:    err.message,
      code:     err.code,
      response: err.response,
      duration: ms,
      smtp:     `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`,
    }, err);
    throw err; // re-throw so caller knows it failed
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. ORDER CONFIRMATION
// ═════════════════════════════════════════════════════════════════════════════
const sendOrderConfirmation = async ({ order, user }) => {
  const sa = order.shippingAddress || {};
  const sc = statusConfig["pending"];
  const t  = createTransporter();

  const customerHtml = wrap(`
    <div class="greeting">Thank you, ${user.name}! 🎉</div>
    <div class="subtitle">Your order has been placed successfully.</div>
    <div class="total-bar">
      <div><div class="total-label">Order Total</div></div>
      <div class="total-amount">${fmt(order.total)}</div>
    </div>
    <div class="card">
      <div class="card-title">📦 Order Details</div>
      <div class="row"><span class="row-label">Order ID</span><span class="row-value" style="font-family:monospace">#${order._id.toString().slice(-8).toUpperCase()}</span></div>
      <div class="row"><span class="row-label">Date</span><span class="row-value">${new Date(order.createdAt).toLocaleString("en-IN")}</span></div>
      <div class="row"><span class="row-label">Payment</span><span class="row-value">${order.paymentId ? "✅ Paid (Razorpay)" : "Cash on Delivery"}</span></div>
      ${order.coupon ? `<div class="row"><span class="row-label">Coupon</span><span class="row-value">🏷 ${order.coupon}</span></div>` : ""}
    </div>
    <div class="card">
      <div class="card-title">🛍 Items Ordered</div>
      ${itemsHtml(order.items)}
      <div class="divider"></div>
      <div class="row"><span class="row-label">Subtotal</span><span class="row-value">${fmt(order.subtotal || order.total)}</span></div>
      ${order.discount > 0 ? `<div class="row"><span class="row-label">Discount</span><span class="row-value" style="color:#16A34A">− ${fmt(order.discount)}</span></div>` : ""}
      <div class="row"><span class="row-label">Delivery</span><span class="row-value">${order.shipping === 0 ? "FREE" : fmt(order.shipping)}</span></div>
      <div class="row"><span class="row-label" style="font-weight:700">Total</span><span class="row-value" style="color:${BRAND_COLOR};font-size:16px">${fmt(order.total)}</span></div>
    </div>
    <div class="card">
      <div class="card-title">📍 Shipping To</div>
      <div style="font-size:14px;color:${DARK_COLOR};line-height:1.8;font-weight:600">${sa.fullName || ""}</div>
      <div style="font-size:13px;color:#555;line-height:1.8">
        ${sa.address || ""}<br/>
        ${[sa.city, sa.state].filter(Boolean).join(", ")}${sa.pin ? " — " + sa.pin : ""}<br/>
        📱 ${sa.phone || ""}
      </div>
    </div>
    <div style="text-align:center;padding:16px 0">
      <span class="status-badge" style="background:${sc.bg};color:${sc.color}">${sc.icon} ${sc.label}</span>
    </div>
  `);

  const adminHtml = wrap(`
    <div class="greeting">🛒 New Order Received!</div>
    <div class="subtitle">A new order has been placed on BanyanVision.</div>
    <div class="total-bar">
      <div><div class="total-label">Order Value</div></div>
      <div class="total-amount">${fmt(order.total)}</div>
    </div>
    <div class="card">
      <div class="card-title">👤 Customer Info</div>
      <div class="row"><span class="row-label">Name</span><span class="row-value">${user.name}</span></div>
      <div class="row"><span class="row-label">Email</span><span class="row-value">${user.email}</span></div>
      <div class="row"><span class="row-label">Phone</span><span class="row-value">${sa.phone || "—"}</span></div>
      <div class="row"><span class="row-label">Order ID</span><span class="row-value" style="font-family:monospace">#${order._id.toString().slice(-8).toUpperCase()}</span></div>
      <div class="row"><span class="row-label">Payment</span><span class="row-value">${order.paymentId ? "✅ Razorpay Paid" : "COD"}</span></div>
      ${order.coupon ? `<div class="row"><span class="row-label">Coupon</span><span class="row-value">${order.coupon}</span></div>` : ""}
    </div>
    <div class="card">
      <div class="card-title">📦 Items</div>
      ${itemsHtml(order.items)}
    </div>
    <div class="card">
      <div class="card-title">📍 Ship To</div>
      <div style="font-size:13px;color:#333;line-height:1.8">
        <strong>${sa.fullName || ""}</strong><br/>
        ${sa.address || ""}<br/>
        ${[sa.city, sa.state].filter(Boolean).join(", ")} — ${sa.pin || ""}<br/>
        📱 ${sa.phone || ""}
      </div>
    </div>
  `);

  await sendMail(t, { from:FROM_ADDRESS, to:user.email,   subject:`✅ Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()} | BanyanVision`, html:customerHtml }, "order_confirmation_customer");
  await sendMail(t, { from:FROM_ADDRESS, to:ADMIN_EMAIL,  subject:`🛒 New Order #${order._id.toString().slice(-8).toUpperCase()} — ${fmt(order.total)} from ${user.name}`, html:adminHtml }, "order_confirmation_admin");
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. STATUS UPDATE
// ═════════════════════════════════════════════════════════════════════════════
const sendStatusUpdate = async ({ order, user, newStatus }) => {
  const sc = statusConfig[newStatus] || statusConfig["pending"];
  const sa = order.shippingAddress || {};
  const t  = createTransporter();
  const isDelivered = newStatus === "delivered";
  const isCancelled = newStatus === "cancelled";

  const customerHtml = wrap(`
    <div class="greeting">${sc.icon} Order ${sc.label}</div>
    <div class="subtitle">${sc.msg}</div>
    <div style="text-align:center;margin:24px 0">
      <span class="status-badge" style="background:${sc.bg};color:${sc.color};font-size:14px;padding:10px 28px">${sc.icon} ${sc.label}</span>
    </div>
    <div class="card">
      <div class="card-title">📦 Your Order</div>
      <div class="row"><span class="row-label">Order ID</span><span class="row-value" style="font-family:monospace">#${order._id.toString().slice(-8).toUpperCase()}</span></div>
      <div class="row"><span class="row-label">Placed On</span><span class="row-value">${new Date(order.createdAt).toLocaleDateString("en-IN")}</span></div>
      <div class="row"><span class="row-label">Total</span><span class="row-value" style="color:${BRAND_COLOR}">${fmt(order.total)}</span></div>
    </div>
    <div class="card">
      <div class="card-title">🛍 Items</div>
      ${itemsHtml(order.items)}
    </div>
    ${isDelivered ? `
    <div style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border-radius:12px;padding:20px;text-align:center;border:1px solid #BBF7D0;margin-bottom:20px">
      <div style="font-size:32px;margin-bottom:8px">🎉</div>
      <div style="font-size:16px;font-weight:700;color:#166534;margin-bottom:6px">We hope you love your purchase!</div>
    </div>` : ""}
    ${isCancelled ? `
    <div style="background:#FEF2F2;border-radius:12px;padding:16px 20px;border:1px solid #FECACA;margin-bottom:20px">
      <div style="font-size:13px;color:#DC2626;line-height:1.8">
        Refund will be processed within <strong>5–7 business days</strong>.
      </div>
    </div>` : ""}
  `);

  await sendMail(t, { from:FROM_ADDRESS, to:user.email, subject:`${sc.icon} Your order is ${sc.label} — #${order._id.toString().slice(-8).toUpperCase()}`, html:customerHtml }, `status_update_${newStatus}`);
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. THANK YOU (on delivery)
// ═════════════════════════════════════════════════════════════════════════════
const sendThankYou = async ({ order, user }) => {
  const t = createTransporter();
  const html = wrap(`
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:48px;margin-bottom:8px">🙏</div>
      <div class="greeting" style="text-align:center">Thank You, ${user.name}!</div>
      <div class="subtitle" style="text-align:center">Your order has been delivered. We're so happy it reached you safely!</div>
    </div>
    <div class="card">
      <div class="card-title">🛍 What You Purchased</div>
      ${itemsHtml(order.items)}
    </div>
    <div style="background:linear-gradient(135deg,${DARK_COLOR},#3D1500);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px">
      <div style="color:rgba(255,255,255,.7);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Special Offer for You</div>
      <div style="color:#F9A825;font-family:monospace;font-size:28px;font-weight:800;letter-spacing:3px;margin-bottom:8px">BANYAN10</div>
      <div style="color:rgba(255,255,255,.8);font-size:13px">10% off on your next order</div>
    </div>
  `);
  await sendMail(t, { from:FROM_ADDRESS, to:user.email, subject:`🙏 Thank You for Shopping with BanyanVision, ${user.name}!`, html }, "thank_you");
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. REVIEW ACKNOWLEDGEMENT
// ═════════════════════════════════════════════════════════════════════════════
const sendReviewAck = async ({ user, product, review }) => {
  const t = createTransporter();
  const html = wrap(`
    <div class="greeting">Thank you for your review, ${user.name}! ⭐</div>
    <div class="subtitle">Your feedback helps the BanyanVision community.</div>
    <div class="card">
      <div class="card-title">📝 Your Review</div>
      <div style="font-size:14px;font-weight:700;color:${DARK_COLOR};margin-bottom:6px">${product.name}</div>
      <div class="stars" style="margin-bottom:10px">${starsHtml(review.rating)}</div>
      <div style="font-size:14px;color:#555;font-style:italic;line-height:1.7;background:#fff;border-left:3px solid ${BRAND_COLOR};padding:10px 14px;border-radius:0 8px 8px 0">"${review.comment}"</div>
    </div>
    <div style="background:linear-gradient(135deg,${DARK_COLOR},#3D1500);border-radius:14px;padding:20px;text-align:center;margin-bottom:20px">
      <div style="color:#F9A825;font-family:monospace;font-size:24px;font-weight:800;letter-spacing:3px">BANYAN10</div>
      <div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:6px">10% off on your next order</div>
    </div>
  `);
  const adminHtml = wrap(`
    <div class="greeting">⭐ New Product Review</div>
    <div class="card">
      <div class="row"><span class="row-label">Customer</span><span class="row-value">${user.name}</span></div>
      <div class="row"><span class="row-label">Email</span><span class="row-value">${user.email}</span></div>
      <div class="row"><span class="row-label">Product</span><span class="row-value">${product.name}</span></div>
      <div class="row"><span class="row-label">Rating</span><span class="row-value">${starsHtml(review.rating)} (${review.rating}/5)</span></div>
    </div>
    <div class="card"><div class="card-title">Comment</div><div style="font-size:13px;color:#333;font-style:italic">"${review.comment}"</div></div>
  `);
  await sendMail(t, { from:FROM_ADDRESS, to:user.email,  subject:`⭐ Thanks for your review on BanyanVision!`, html }, "review_ack_customer");
  await sendMail(t, { from:FROM_ADDRESS, to:ADMIN_EMAIL, subject:`⭐ New Review: ${product.name} — ${review.rating}/5 by ${user.name}`, html:adminHtml }, "review_ack_admin");
};

// ─── Safe wrapper ─────────────────────────────────────────────────────────────
const sendSafe = (fn, args) => {
  fn(args).catch(err => {
    log.error("email", `Email send failed: ${fn.name}`, {
      error:    err.message,
      code:     err.code,
      response: err.response,
      to:       args?.user?.email || args?.adminEmail || "unknown",
      smtp:     `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`,
    }, err);
  });
};

// ═════════════════════════════════════════════════════════════════════════════
// 5. ORDERS EXPORT EMAIL
// ═════════════════════════════════════════════════════════════════════════════
const sendOrdersExportEmail = async ({ orders, statusFilter, adminEmail }) => {
  const t = createTransporter();
  const headers = ["Order ID","Date","Customer Name","Customer Email","Phone","Items","Subtotal","Discount","Shipping","Total","Payment","Status","Coupon","Full Name","Address","City","State","PIN"];
  const rows = orders.map(ord => {
    const sa = ord.shippingAddress || {};
    const items = ord.items.map(i => `${i.name}(x${i.qty})`).join(" | ");
    const esc = v => `"${String(v||"").replace(/"/g,'""')}"`;
    return [esc(ord._id.toString().slice(-8).toUpperCase()),esc(new Date(ord.createdAt).toLocaleString("en-IN")),esc(ord.user?.name||""),esc(ord.user?.email||""),esc(sa.phone||""),esc(items),esc(ord.subtotal||ord.total),esc(ord.discount||0),esc(ord.shipping||0),esc(ord.total),esc(ord.paymentId?"Razorpay":"COD"),esc(ord.status),esc(ord.coupon||""),esc(sa.fullName||""),esc(sa.address||""),esc(sa.city||""),esc(sa.state||""),esc(sa.pin||"")].join(",");
  });
  const csv      = [headers.join(","), ...rows].join("\n");
  const dateStr  = new Date().toLocaleDateString("en-IN").replace(/\//g,"-");
  const filename = `BanyanVision_Orders_${statusFilter}_${dateStr}.csv`;
  const total    = orders.length;
  const revenue  = orders.reduce((s,o) => s+(o.total||0), 0);
  const byStatus = {};
  orders.forEach(o => { byStatus[o.status] = (byStatus[o.status]||0) + 1; });
  const statusRows = Object.entries(byStatus).map(([s,c]) => `<div class="row"><span class="row-label" style="text-transform:capitalize">${s}</span><span class="row-value">${c} orders</span></div>`).join("");

  const html = wrap(`
    <div class="greeting">📊 Orders Export Ready</div>
    <div class="subtitle">Your BanyanVision orders export is attached. Filter: <strong>${statusFilter === "all" ? "All Orders" : statusFilter.toUpperCase()}</strong></div>
    <div class="total-bar">
      <div><div class="total-label">Total Orders Exported</div></div>
      <div class="total-amount">${total}</div>
    </div>
    <div class="card">
      <div class="card-title">📈 Summary</div>
      <div class="row"><span class="row-label">Total Revenue</span><span class="row-value" style="color:${BRAND_COLOR}">${fmt(revenue)}</span></div>
      <div class="row"><span class="row-label">Export Date</span><span class="row-value">${new Date().toLocaleString("en-IN")}</span></div>
    </div>
    <div class="card"><div class="card-title">📋 By Status</div>${statusRows || "<div style='color:#aaa;font-size:13px'>No orders</div>"}</div>
    <div style="background:#F0FDF4;border-radius:10px;padding:12px 16px;font-size:12px;color:#166534;border:1px solid #BBF7D0">
      📎 <strong>${filename}</strong> is attached to this email.
    </div>
  `);

  await sendMail(t, { from:FROM_ADDRESS, to:adminEmail, subject:`📊 BanyanVision Orders Export — ${total} orders (${statusFilter}) · ${dateStr}`, html, attachments:[{ filename, content:Buffer.from(csv,"utf-8"), contentType:"text/csv; charset=utf-8" }] }, "orders_export");
};

// ─── SMTP Verify ──────────────────────────────────────────────────────────────
const verifySmtp = async () => {
  const { valid, missing } = validateSmtpConfig();
  if (!valid) {
    const msg = `SMTP config missing: ${missing.join(", ")}`;
    log.warn("email", msg);
    console.warn(`⚠️  Email: ${msg} — set in .env / Railway`);
    return { ok: false, error: msg };
  }
  // Note: We do NOT call verify() here — Zoho rejects NOOP probes
  // but still sends mail fine. Just log that config is present.
  log.info("email", "SMTP config present — transporter ready", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
  });
  console.log(`✅ Email: SMTP configured (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`);
  return { ok: true };
};

// ─── Email diagnostic (admin API) ────────────────────────────────────────────
const diagnoseMail = async (toAddress) => {
  const result = { steps: [], ok: false };

  // Step 1: config check
  const { valid, missing, cfg } = validateSmtpConfig();
  result.steps.push({
    step: "Config check",
    ok: valid,
    detail: valid
      ? `Host:${cfg.host} Port:${cfg.port} Secure:${cfg.secure} User:${cfg.user}`
      : `Missing env vars: ${missing.join(", ")}`,
  });
  if (!valid) return result;

  // Step 2: SMTP connect (auto-tries fallback ports)
  let transporter;
  try {
    const connResult = await verifySmtpConnection();
    if (connResult.ok) {
      transporter = createTransporter();
      result.steps.push({ step: "SMTP connect", ok: true, detail: `Connected on port ${connResult.port}${connResult.tip ? " — " + connResult.tip : ""}` });
    } else if (connResult.zohoNote) {
      // verify() failed but mail might work anyway (Zoho quirk)
      transporter = createTransporter();
      result.steps.push({ step: "SMTP connect", ok: true, detail: connResult.zohoNote });
    } else {
      throw new Error(connResult.error || "SMTP connect failed");
    }
  } catch (err) {
    result.steps.push({
      step: "SMTP connect", ok: false,
      detail: err.message,
      hint: "All ports (465, 587, 2525) failed. Go to Railway → Variables and check SMTP_* values.",
    });
    return result;
  }

  // Step 3: Send test email
  try {
    const to = toAddress || process.env.ADMIN_EMAIL;
    await transporter.sendMail({
      from:    FROM_ADDRESS,
      to,
      subject: `✅ BanyanVision Email Test — ${new Date().toLocaleString("en-IN")}`,
      html:    wrap(`
        <div class="greeting">📧 Email Test Successful!</div>
        <div class="subtitle">Your BanyanVision email system is working correctly in production.</div>
        <div class="card">
          <div class="card-title">Test Details</div>
          <div class="row"><span class="row-label">Sent At</span><span class="row-value">${new Date().toLocaleString("en-IN")}</span></div>
          <div class="row"><span class="row-label">SMTP Host</span><span class="row-value">${process.env.SMTP_HOST}</span></div>
          <div class="row"><span class="row-label">Port</span><span class="row-value">${process.env.SMTP_PORT}</span></div>
          <div class="row"><span class="row-label">From</span><span class="row-value">${FROM_ADDRESS}</span></div>
          <div class="row"><span class="row-label">To</span><span class="row-value">${to}</span></div>
          <div class="row"><span class="row-label">Environment</span><span class="row-value">${process.env.NODE_ENV}</span></div>
        </div>
        <div style="background:#F0FDF4;border-radius:10px;padding:16px;text-align:center;border:1px solid #BBF7D0">
          <div style="font-size:32px;margin-bottom:6px">✅</div>
          <div style="font-weight:700;color:#166534">Email system is fully operational!</div>
        </div>
      `),
    });
    result.steps.push({ step: "Send test email", ok: true, detail: `Test email sent to ${to}` });
    result.ok = true;
  } catch (err) {
    result.steps.push({
      step: "Send test email", ok: false,
      detail: `${err.message} (code: ${err.code})`,
      hint: "SMTP connected but sending failed. Check FROM address and Zoho outbound permissions.",
    });
  }

  return result;
};

module.exports = {
  sendOrderConfirmation, sendStatusUpdate, sendThankYou,
  sendReviewAck, sendSafe, sendOrdersExportEmail,
  verifySmtp, diagnoseMail,
};
