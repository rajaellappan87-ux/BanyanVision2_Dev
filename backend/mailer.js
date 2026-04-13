const nodemailer = require("nodemailer");
const log = require("./logger");

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL SENDER — dual mode
//
//  LOCAL  (EMAIL_PROVIDER=zoho)   → nodemailer + Zoho SMTP
//  PROD   (EMAIL_PROVIDER=resend) → Resend HTTP API (port 443, never blocked)
//
//  Railway blocks all outbound SMTP ports (465, 587, 2525).
//  Resend HTTP API bypasses this completely.
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER    = process.env.EMAIL_PROVIDER || "zoho";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL    || "admin@banyanvision.com";
const FROM        = process.env.EMAIL_FROM     || `"BanyanVision" <${process.env.SMTP_USER || ADMIN_EMAIL}>`;
const BRAND       = "#C2185B";
const GOLD        = "#E65100";
const DARK        = "#1A0A00";

// ─── Resend HTTP sender ───────────────────────────────────────────────────────
// Uses fetch (built into Node 18+) — pure HTTP, no SMTP, never blocked
const sendViaResend = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set in Railway environment variables");

  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Resend API error ${res.status}: ${data?.message || JSON.stringify(data)}`);
  }

  return data; // { id: "..." }
};

// ─── Nodemailer (Zoho SMTP) sender ────────────────────────────────────────────
const sendViaSmtp = async ({ to, subject, html }) => {
  const missing = [];
  if (!process.env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!process.env.SMTP_USER) missing.push("SMTP_USER");
  if (!process.env.SMTP_PASS) missing.push("SMTP_PASS");
  if (missing.length) throw new Error(`SMTP config missing: ${missing.join(", ")}`);

  const t = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== "false",
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls:    { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
  });

  return t.sendMail({ from: FROM, to, subject, html });
};

// ─── Unified send ─────────────────────────────────────────────────────────────
const send = async ({ to, subject, html }, context = "") => {
  const start = Date.now();
  try {
    let info;
    if (PROVIDER === "resend") {
      info = await sendViaResend({ to, subject, html });
    } else {
      info = await sendViaSmtp({ to, subject, html });
    }
    log.mail(`Email sent: ${context}`, {
      provider: PROVIDER, to, subject,
      id:       info?.id || info?.messageId,
      ms:       Date.now() - start,
    });
    return info;
  } catch (err) {
    log.error("email", `Email FAILED: ${context}`, {
      provider: PROVIDER, to, subject,
      error:    err.message,
      ms:       Date.now() - start,
    }, err);
    throw err;
  }
};

// ─── Safe fire-and-forget wrapper ────────────────────────────────────────────
const sendSafe = (fn, args) => {
  fn(args).catch(err =>
    log.error("email", `sendSafe failed: ${fn.name}`, {
      provider: PROVIDER,
      error:    err.message,
      to:       args?.user?.email || args?.adminEmail || "unknown",
    }, err)
  );
};

// ─── HTML wrapper ─────────────────────────────────────────────────────────────
const wrap = (body) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
body{margin:0;padding:0;background:#F5F0EA;font-family:'Segoe UI',Arial,sans-serif;}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.1);}
.header{background:linear-gradient(135deg,${DARK},#3D1500);padding:28px 32px;text-align:center;}
.brand{color:#fff;font-size:28px;font-weight:800;letter-spacing:.5px;margin:8px 0 4px;}
.tagline{color:rgba(255,255,255,.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;}
.body{padding:32px;}
.greeting{font-size:22px;font-weight:700;color:${DARK};margin-bottom:6px;}
.subtitle{font-size:14px;color:#666;margin-bottom:24px;line-height:1.6;}
.card{background:#FDF8F3;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #F0E8DD;}
.card-title{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND};margin-bottom:12px;}
.row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F0E8DD;font-size:13px;}
.row:last-child{border-bottom:none;}
.row-label{color:#888;font-weight:500;}
.row-value{color:${DARK};font-weight:700;text-align:right;}
.item-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #F0E8DD;}
.item-row:last-child{border-bottom:none;}
.item-img{width:52px;height:64px;object-fit:cover;border-radius:8px;background:#eee;flex-shrink:0;}
.item-name{font-size:13px;font-weight:700;color:${DARK};}
.item-meta{font-size:11px;color:#999;margin-top:3px;}
.item-price{font-size:13px;font-weight:800;color:${BRAND};margin-top:4px;}
.total-bar{background:linear-gradient(135deg,${BRAND},${GOLD});border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.total-label{color:rgba(255,255,255,.85);font-size:12px;font-weight:600;}
.total-amount{color:#fff;font-size:22px;font-weight:800;}
.status-badge{display:inline-block;padding:6px 18px;border-radius:99px;font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;}
.divider{height:1px;background:#F0E8DD;margin:20px 0;}
.stars{color:#F9A825;font-size:20px;letter-spacing:2px;}
.footer{background:#FDF8F3;padding:20px 32px;text-align:center;border-top:1px solid #F0E8DD;}
.footer-text{font-size:11px;color:#aaa;line-height:1.8;}
@media(max-width:600px){.body{padding:20px;}.header{padding:20px;}}
</style></head><body>
<div class="wrap">
  <div class="header">
    <div class="brand">BanyanVision</div>
    <div class="tagline">Empowering Dreams, Inspiring Innovations</div>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    <div class="footer-text">
      © 2026 BanyanVision. Questions? Write to
      <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND}">${ADMIN_EMAIL}</a>
    </div>
  </div>
</div></body></html>`;

const fmt  = n => "₹" + Number(n).toLocaleString("en-IN");
const stars = r => "★".repeat(r) + "☆".repeat(5 - r);

const itemsHtml = items => items.map(it => `
  <div class="item-row">
    <img class="item-img" src="${it.image||""}" alt="${it.name}" onerror="this.style.background='#F5E6EC'"/>
    <div style="flex:1">
      <div class="item-name">${it.name}</div>
      <div class="item-meta">${[it.color,it.size].filter(Boolean).join(" · ")} · Qty: ${it.qty}</div>
      <div class="item-price">${fmt(it.price)} each · ${fmt(it.price*it.qty)}</div>
    </div>
  </div>`).join("");

const SC = {
  pending:    { label:"Order Placed",     color:"#D97706", bg:"#FEF3C7", icon:"🕐" },
  processing: { label:"Being Prepared",   color:"#2563EB", bg:"#EFF6FF", icon:"⚙️" },
  shipped:    { label:"Out for Delivery", color:"#7C3AED", bg:"#F5F3FF", icon:"🚚" },
  delivered:  { label:"Delivered",        color:"#16A34A", bg:"#F0FDF4", icon:"✅" },
  cancelled:  { label:"Cancelled",        color:"#DC2626", bg:"#FEF2F2", icon:"❌" },
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. ORDER CONFIRMATION
// ═════════════════════════════════════════════════════════════════════════════
const sendOrderConfirmation = async ({ order, user }) => {
  const sa = order.shippingAddress || {};
  const sc = SC.pending;
  const id = order._id.toString().slice(-8).toUpperCase();

  await send({
    to: user.email,
    subject: `✅ Order Confirmed — #${id} | BanyanVision`,
    html: wrap(`
      <div class="greeting">Thank you, ${user.name}! 🎉</div>
      <div class="subtitle">Your order has been placed successfully.</div>
      <div class="total-bar"><div><div class="total-label">Order Total</div></div><div class="total-amount">${fmt(order.total)}</div></div>
      <div class="card">
        <div class="card-title">📦 Order Details</div>
        <div class="row"><span class="row-label">Order ID</span><span class="row-value" style="font-family:monospace">#${id}</span></div>
        <div class="row"><span class="row-label">Date</span><span class="row-value">${new Date(order.createdAt).toLocaleString("en-IN")}</span></div>
        <div class="row"><span class="row-label">Payment</span><span class="row-value">${order.paymentId?"✅ Paid (Razorpay)":"Cash on Delivery"}</span></div>
        ${order.coupon?`<div class="row"><span class="row-label">Coupon</span><span class="row-value">🏷 ${order.coupon}</span></div>`:""}
      </div>
      <div class="card">
        <div class="card-title">🛍 Items Ordered</div>
        ${itemsHtml(order.items)}
        <div class="divider"></div>
        <div class="row"><span class="row-label">Subtotal</span><span class="row-value">${fmt(order.subtotal||order.total)}</span></div>
        ${order.discount>0?`<div class="row"><span class="row-label">Discount</span><span class="row-value" style="color:#16A34A">− ${fmt(order.discount)}</span></div>`:""}
        <div class="row"><span class="row-label">Delivery</span><span class="row-value">${order.shipping===0?"FREE":fmt(order.shipping)}</span></div>
        <div class="row"><span class="row-label" style="font-weight:700">Total</span><span class="row-value" style="color:${BRAND};font-size:16px">${fmt(order.total)}</span></div>
      </div>
      <div class="card">
        <div class="card-title">📍 Shipping To</div>
        <div style="font-size:14px;color:${DARK};line-height:1.8;font-weight:600">${sa.fullName||""}</div>
        <div style="font-size:13px;color:#555;line-height:1.8">${sa.address||""}<br/>${[sa.city,sa.state].filter(Boolean).join(", ")}${sa.pin?" — "+sa.pin:""}<br/>📱 ${sa.phone||""}</div>
      </div>
      <div style="text-align:center;padding:16px 0">
        <span class="status-badge" style="background:${sc.bg};color:${sc.color}">${sc.icon} ${sc.label}</span>
      </div>`)
  }, "order_confirmation_customer");

  await send({
    to: ADMIN_EMAIL,
    subject: `🛒 New Order #${id} — ${fmt(order.total)} from ${user.name}`,
    html: wrap(`
      <div class="greeting">🛒 New Order Received!</div>
      <div class="total-bar"><div><div class="total-label">Order Value</div></div><div class="total-amount">${fmt(order.total)}</div></div>
      <div class="card">
        <div class="card-title">👤 Customer Info</div>
        <div class="row"><span class="row-label">Name</span><span class="row-value">${user.name}</span></div>
        <div class="row"><span class="row-label">Email</span><span class="row-value">${user.email}</span></div>
        <div class="row"><span class="row-label">Phone</span><span class="row-value">${sa.phone||"—"}</span></div>
        <div class="row"><span class="row-label">Order ID</span><span class="row-value" style="font-family:monospace">#${id}</span></div>
        <div class="row"><span class="row-label">Payment</span><span class="row-value">${order.paymentId?"✅ Razorpay Paid":"COD"}</span></div>
        ${order.coupon?`<div class="row"><span class="row-label">Coupon</span><span class="row-value">${order.coupon}</span></div>`:""}
      </div>
      <div class="card"><div class="card-title">📦 Items</div>${itemsHtml(order.items)}</div>
      <div class="card">
        <div class="card-title">📍 Ship To</div>
        <div style="font-size:13px;color:#333;line-height:1.8"><strong>${sa.fullName||""}</strong><br/>${sa.address||""}<br/>${[sa.city,sa.state].filter(Boolean).join(", ")} — ${sa.pin||""}<br/>📱 ${sa.phone||""}</div>
      </div>`)
  }, "order_confirmation_admin");
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. STATUS UPDATE
// ═════════════════════════════════════════════════════════════════════════════
const sendStatusUpdate = async ({ order, user, newStatus }) => {
  const sc = SC[newStatus] || SC.pending;
  const id = order._id.toString().slice(-8).toUpperCase();

  await send({
    to: user.email,
    subject: `${sc.icon} Your order is ${sc.label} — #${id}`,
    html: wrap(`
      <div class="greeting">${sc.icon} Order ${sc.label}</div>
      <div style="text-align:center;margin:24px 0">
        <span class="status-badge" style="background:${sc.bg};color:${sc.color};font-size:14px;padding:10px 28px">${sc.icon} ${sc.label}</span>
      </div>
      <div class="card">
        <div class="card-title">📦 Your Order</div>
        <div class="row"><span class="row-label">Order ID</span><span class="row-value" style="font-family:monospace">#${id}</span></div>
        <div class="row"><span class="row-label">Total</span><span class="row-value" style="color:${BRAND}">${fmt(order.total)}</span></div>
      </div>
      <div class="card"><div class="card-title">🛍 Items</div>${itemsHtml(order.items)}</div>
      ${newStatus==="cancelled"?`<div style="background:#FEF2F2;border-radius:12px;padding:16px;border:1px solid #FECACA;margin-bottom:20px"><div style="font-size:13px;color:#DC2626">Refund will be processed within <strong>5–7 business days</strong>.</div></div>`:""}`)
  }, `status_update_${newStatus}`);
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. THANK YOU
// ═════════════════════════════════════════════════════════════════════════════
const sendThankYou = async ({ order, user }) => {
  await send({
    to: user.email,
    subject: `🙏 Thank You for Shopping with BanyanVision, ${user.name}!`,
    html: wrap(`
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:48px;margin-bottom:8px">🙏</div>
        <div class="greeting" style="text-align:center">Thank You, ${user.name}!</div>
        <div class="subtitle" style="text-align:center">Your order has been delivered safely!</div>
      </div>
      <div class="card"><div class="card-title">🛍 What You Purchased</div>${itemsHtml(order.items)}</div>
      <div style="background:linear-gradient(135deg,${DARK},#3D1500);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px">
        <div style="color:rgba(255,255,255,.7);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Special Offer</div>
        <div style="color:#F9A825;font-family:monospace;font-size:28px;font-weight:800;letter-spacing:3px;margin-bottom:8px">BANYAN10</div>
        <div style="color:rgba(255,255,255,.8);font-size:13px">10% off on your next order</div>
      </div>`)
  }, "thank_you");
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. REVIEW ACK
// ═════════════════════════════════════════════════════════════════════════════
const sendReviewAck = async ({ user, product, review }) => {
  await send({
    to: user.email,
    subject: `⭐ Thanks for your review on BanyanVision!`,
    html: wrap(`
      <div class="greeting">Thank you for your review, ${user.name}! ⭐</div>
      <div class="card">
        <div class="card-title">📝 Your Review</div>
        <div style="font-size:14px;font-weight:700;color:${DARK};margin-bottom:6px">${product.name}</div>
        <div class="stars" style="margin-bottom:10px">${stars(review.rating)}</div>
        <div style="font-size:14px;color:#555;font-style:italic;line-height:1.7;background:#fff;border-left:3px solid ${BRAND};padding:10px 14px;border-radius:0 8px 8px 0">"${review.comment}"</div>
      </div>
      <div style="background:linear-gradient(135deg,${DARK},#3D1500);border-radius:14px;padding:20px;text-align:center">
        <div style="color:#F9A825;font-family:monospace;font-size:24px;font-weight:800;letter-spacing:3px">BANYAN10</div>
        <div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:6px">10% off on your next order</div>
      </div>`)
  }, "review_ack_customer");

  await send({
    to: ADMIN_EMAIL,
    subject: `⭐ New Review: ${product.name} — ${review.rating}/5 by ${user.name}`,
    html: wrap(`
      <div class="greeting">⭐ New Product Review</div>
      <div class="card">
        <div class="row"><span class="row-label">Customer</span><span class="row-value">${user.name}</span></div>
        <div class="row"><span class="row-label">Email</span><span class="row-value">${user.email}</span></div>
        <div class="row"><span class="row-label">Product</span><span class="row-value">${product.name}</span></div>
        <div class="row"><span class="row-label">Rating</span><span class="row-value">${stars(review.rating)} (${review.rating}/5)</span></div>
      </div>
      <div class="card"><div class="card-title">Comment</div><div style="font-size:13px;color:#333;font-style:italic">"${review.comment}"</div></div>`)
  }, "review_ack_admin");
};

// ═════════════════════════════════════════════════════════════════════════════
// 5. ORDERS EXPORT
// ═════════════════════════════════════════════════════════════════════════════
const sendOrdersExportEmail = async ({ orders, statusFilter, adminEmail }) => {
  const headers = ["Order ID","Date","Customer","Email","Phone","Items","Subtotal","Discount","Shipping","Total","Payment","Status","Coupon","Name","Address","City","State","PIN"];
  const esc = v => `"${String(v||"").replace(/"/g,'""')}"`;
  const rows = orders.map(o => {
    const sa = o.shippingAddress||{};
    return [esc(o._id.toString().slice(-8).toUpperCase()),esc(new Date(o.createdAt).toLocaleString("en-IN")),esc(o.user?.name),esc(o.user?.email),esc(sa.phone),esc(o.items.map(i=>`${i.name}(x${i.qty})`).join("|")),esc(o.subtotal||o.total),esc(o.discount||0),esc(o.shipping||0),esc(o.total),esc(o.paymentId?"Razorpay":"COD"),esc(o.status),esc(o.coupon),esc(sa.fullName),esc(sa.address),esc(sa.city),esc(sa.state),esc(sa.pin)].join(",");
  });
  const csv      = [headers.join(","), ...rows].join("\n");
  const dateStr  = new Date().toLocaleDateString("en-IN").replace(/\//g,"-");
  const filename = `BanyanVision_Orders_${statusFilter}_${dateStr}.csv`;
  const revenue  = orders.reduce((s,o)=>s+(o.total||0),0);

  await send({
    to: adminEmail,
    subject: `📊 Orders Export — ${orders.length} orders (${statusFilter}) · ${dateStr}`,
    html: wrap(`
      <div class="greeting">📊 Orders Export Ready</div>
      <div class="total-bar"><div><div class="total-label">Orders Exported</div></div><div class="total-amount">${orders.length}</div></div>
      <div class="card">
        <div class="row"><span class="row-label">Total Revenue</span><span class="row-value" style="color:${BRAND}">${fmt(revenue)}</span></div>
        <div class="row"><span class="row-label">Export Date</span><span class="row-value">${new Date().toLocaleString("en-IN")}</span></div>
      </div>
      <div style="background:#F0FDF4;border-radius:10px;padding:12px 16px;font-size:12px;color:#166534;border:1px solid #BBF7D0">
        📎 <strong>${filename}</strong> is attached.
      </div>`)
  }, "orders_export");
};

// ─── verifySmtp (startup check) ───────────────────────────────────────────────
const verifySmtp = async () => {
  if (PROVIDER === "resend") {
    if (!process.env.RESEND_API_KEY) {
      log.warn("email", "RESEND_API_KEY not set — emails will not send");
      console.warn("⚠️  Email: RESEND_API_KEY missing in Railway variables");
      return { ok: false };
    }
    log.info("email", "Email provider: Resend HTTP API (Railway-compatible)");
    console.log("✅ Email: Resend configured (HTTP API — no SMTP ports needed)");
    return { ok: true };
  }

  // Zoho — just check config, no verify() (Zoho rejects NOOP probes)
  const missing = [];
  if (!process.env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!process.env.SMTP_USER) missing.push("SMTP_USER");
  if (!process.env.SMTP_PASS) missing.push("SMTP_PASS");
  if (missing.length) {
    log.warn("email", `SMTP config missing: ${missing.join(", ")}`);
    console.warn(`⚠️  Email: missing ${missing.join(", ")}`);
    return { ok: false };
  }
  log.info("email", `Email provider: Zoho SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT||465})`);
  console.log(`✅ Email: Zoho SMTP configured (${process.env.SMTP_HOST}:${process.env.SMTP_PORT||465})`);
  return { ok: true };
};

// ─── Diagnostic ───────────────────────────────────────────────────────────────
const diagnoseMail = async (toAddress) => {
  const result = { steps: [], ok: false, provider: PROVIDER };
  const to = toAddress || ADMIN_EMAIL;

  // Step 1: config
  if (PROVIDER === "resend") {
    const hasKey = !!process.env.RESEND_API_KEY;
    result.steps.push({
      step: "Config check",
      ok: hasKey,
      detail: hasKey
        ? `Provider: Resend HTTP API · From: ${FROM}`
        : "RESEND_API_KEY not set in Railway environment variables",
    });
    if (!hasKey) return result;
  } else {
    const missing = [];
    if (!process.env.SMTP_HOST) missing.push("SMTP_HOST");
    if (!process.env.SMTP_USER) missing.push("SMTP_USER");
    if (!process.env.SMTP_PASS) missing.push("SMTP_PASS");
    result.steps.push({
      step: "Config check",
      ok: missing.length === 0,
      detail: missing.length === 0
        ? `Provider: Zoho SMTP · Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT||465} · User: ${process.env.SMTP_USER}`
        : `Missing: ${missing.join(", ")}`,
    });
    if (missing.length) return result;
  }

  // Step 2: send test email
  try {
    await send({
      to,
      subject: `✅ BanyanVision Email Test — ${new Date().toLocaleString("en-IN")}`,
      html: wrap(`
        <div class="greeting">📧 Email Test Successful!</div>
        <div class="subtitle">Your BanyanVision email system is working in production.</div>
        <div class="card">
          <div class="card-title">Test Details</div>
          <div class="row"><span class="row-label">Provider</span><span class="row-value">${PROVIDER}</span></div>
          <div class="row"><span class="row-label">Sent At</span><span class="row-value">${new Date().toLocaleString("en-IN")}</span></div>
          <div class="row"><span class="row-label">From</span><span class="row-value">${FROM}</span></div>
          <div class="row"><span class="row-label">To</span><span class="row-value">${to}</span></div>
          <div class="row"><span class="row-label">Environment</span><span class="row-value">${process.env.NODE_ENV}</span></div>
        </div>
        <div style="background:#F0FDF4;border-radius:10px;padding:16px;text-align:center;border:1px solid #BBF7D0">
          <div style="font-size:32px;margin-bottom:6px">✅</div>
          <div style="font-weight:700;color:#166534">Email system fully operational!</div>
        </div>`)
    }, "test_email");
    result.steps.push({ step: "Send test email", ok: true, detail: `Test email sent to ${to} — check your inbox` });
    result.ok = true;
  } catch (err) {
    result.steps.push({
      step: "Send test email", ok: false,
      detail: err.message,
      hint: PROVIDER === "resend"
        ? "Check RESEND_API_KEY is correct and domain is verified in Resend dashboard"
        : "Zoho SMTP blocked by Railway. Set EMAIL_PROVIDER=resend in Railway variables",
    });
  }

  return result;
};

module.exports = {
  sendOrderConfirmation, sendStatusUpdate, sendThankYou,
  sendReviewAck, sendSafe, sendOrdersExportEmail,
  verifySmtp, diagnoseMail,
};
