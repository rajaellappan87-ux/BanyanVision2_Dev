const nodemailer = require("nodemailer");

// ─── Transporter (SMTP) ───────────────────────────────────────────────────────
// Works with any SMTP provider: GoDaddy, Hostinger, cPanel, Zoho, Outlook etc.
const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST,               // e.g. mail.banyanvision.com
    port:   Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== "false",  // true for port 465, false for 587
    auth: {
      user: process.env.SMTP_USER,               // e.g. admin@banyanvision.com
      pass: process.env.SMTP_PASS,               // your email account password
    },
    tls: {
      rejectUnauthorized: false,                 // allows self-signed certs (cPanel)
    },
  });

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
  .logo{width:100px;height:100px;object-fit:contain;}
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
  .btn-outline{display:inline-block;padding:12px 28px;background:#fff;color:${BRAND_COLOR};text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;border:2px solid ${BRAND_COLOR};margin:8px 4px;}
  .divider{height:1px;background:#F0E8DD;margin:20px 0;}
  .stars{color:#F9A825;font-size:20px;letter-spacing:2px;}
  .footer{background:#FDF8F3;padding:20px 32px;text-align:center;border-top:1px solid #F0E8DD;}
  .footer-text{font-size:11px;color:#aaa;line-height:1.8;}
  .social{margin:10px 0;}
  .highlight{color:${BRAND_COLOR};font-weight:700;}
  @media(max-width:600px){.body{padding:20px;}.header{padding:20px;}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img class="logo" src="https://i.imgur.com/placeholder.png" alt="BanyanVision"
      onerror="this.style.display='none'"/>
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

// ─── Helper: format currency ───────────────────────────────────────────────────
const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");

// ─── Helper: item rows HTML ───────────────────────────────────────────────────
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

// ─── Helper: status config ────────────────────────────────────────────────────
const statusConfig = {
  pending:    { label:"Order Placed",     color:"#D97706", bg:"#FEF3C7", icon:"🕐", msg:"We've received your order and will begin processing soon." },
  processing: { label:"Being Prepared",   color:"#2563EB", bg:"#EFF6FF", icon:"⚙️", msg:"Our team is carefully packing your order with love." },
  shipped:    { label:"Out for Delivery", color:"#7C3AED", bg:"#F5F3FF", icon:"🚚", msg:"Your order is on its way! Expect it within 1-3 business days." },
  delivered:  { label:"Delivered",        color:"#16A34A", bg:"#F0FDF4", icon:"✅", msg:"Your order has been delivered. We hope you love it!" },
  cancelled:  { label:"Cancelled",        color:"#DC2626", bg:"#FEF2F2", icon:"❌", msg:"Your order has been cancelled. Refund (if paid) will be processed within 5-7 business days." },
};

// ─── Stars renderer ───────────────────────────────────────────────────────────
const starsHtml = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

// ═════════════════════════════════════════════════════════════════════════════
// 1. ORDER CONFIRMATION — sent to customer + admin on new order
// ═════════════════════════════════════════════════════════════════════════════
const sendOrderConfirmation = async ({ order, user }) => {
  const sa = order.shippingAddress || {};
  const sc = statusConfig["pending"];
  const transporter = createTransporter();

  // ── Customer email ──
  const customerHtml = wrap(`
    <div class="greeting">Thank you, ${user.name}! 🎉</div>
    <div class="subtitle">Your order has been placed successfully. We're thrilled to have you shop with us!</div>

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
      <div class="row"><span class="row-label" style="font-weight:700;color:${DARK_COLOR}">Total</span><span class="row-value" style="color:${BRAND_COLOR};font-size:16px">${fmt(order.total)}</span></div>
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

    <div style="text-align:center;padding:16px 0;">
      <div style="font-size:13px;color:#888;margin-bottom:16px">We'll send you updates as your order progresses.</div>
      <span class="status-badge" style="background:${sc.bg};color:${sc.color}">${sc.icon} ${sc.label}</span>
    </div>
  `);

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: user.email,
    subject: `✅ Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()} | BanyanVision`,
    html: customerHtml,
  });

  // ── Admin notification email ──
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
      ${order.coupon ? `<div class="row"><span class="row-label">Coupon Used</span><span class="row-value">${order.coupon}</span></div>` : ""}
    </div>

    <div class="card">
      <div class="card-title">📦 Items</div>
      ${itemsHtml(order.items)}
    </div>

    <div class="card">
      <div class="card-title">📍 Ship To</div>
      <div style="font-size:13px;color:#333;line-height:1.8">
        <strong>${sa.fullName}</strong><br/>
        ${sa.address}<br/>
        ${[sa.city, sa.state].filter(Boolean).join(", ")} — ${sa.pin}<br/>
        📱 ${sa.phone}
      </div>
    </div>
  `);

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject: `🛒 New Order #${order._id.toString().slice(-8).toUpperCase()} — ${fmt(order.total)} from ${user.name}`,
    html: adminHtml,
  });

  console.log(`📧 Order confirmation emails sent for order ${order._id}`);
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. STATUS UPDATE — sent to customer when admin changes order status
// ═════════════════════════════════════════════════════════════════════════════
const sendStatusUpdate = async ({ order, user, newStatus }) => {
  const sc = statusConfig[newStatus] || statusConfig["pending"];
  const sa = order.shippingAddress || {};
  const transporter = createTransporter();

  const isDelivered = newStatus === "delivered";
  const isCancelled = newStatus === "cancelled";

  const customerHtml = wrap(`
    <div class="greeting">${sc.icon} Order ${sc.label}</div>
    <div class="subtitle">${sc.msg}</div>

    <div style="text-align:center;margin:24px 0;">
      <span class="status-badge" style="background:${sc.bg};color:${sc.color};font-size:14px;padding:10px 28px">${sc.icon} ${sc.label}</span>
    </div>

    <!-- Progress tracker -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 28px;padding:20px;background:#FDF8F3;border-radius:12px;border:1px solid #F0E8DD;">
      ${["pending","processing","shipped","delivered"].map((s, i) => {
        const conf = statusConfig[s];
        const steps = ["pending","processing","shipped","delivered"];
        const currentIdx = steps.indexOf(newStatus);
        const stepIdx = i;
        const done = !isCancelled && stepIdx <= currentIdx;
        return `<div style="text-align:center;flex:1">
          <div style="width:32px;height:32px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:14px;
            background:${done ? `linear-gradient(135deg,${BRAND_COLOR},${GOLD_COLOR})` : "#eee"};color:${done ? "#fff" : "#aaa"}">
            ${conf.icon}
          </div>
          <div style="font-size:9px;font-weight:700;color:${done ? BRAND_COLOR : "#aaa"};letter-spacing:.5px;text-transform:uppercase">${conf.label}</div>
        </div>
        ${i < 3 ? `<div style="height:2px;flex:1;background:${done && stepIdx < currentIdx ? `linear-gradient(90deg,${BRAND_COLOR},${GOLD_COLOR})` : "#eee"};margin-bottom:18px"></div>` : ""}`;
      }).join("")}
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
      <div style="font-size:13px;color:#15803D;line-height:1.6">Share your experience — your review helps other shoppers discover great Indian fashion.</div>
    </div>` : ""}

    ${isCancelled ? `
    <div style="background:#FEF2F2;border-radius:12px;padding:16px 20px;border:1px solid #FECACA;margin-bottom:20px">
      <div style="font-size:13px;color:#DC2626;line-height:1.8;font-weight:500">
        If you paid online, your refund will be processed within <strong>5–7 business days</strong>.<br/>
        For queries, write to us at <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND_COLOR}">${ADMIN_EMAIL}</a>
      </div>
    </div>` : ""}
  `);

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: user.email,
    subject: `${sc.icon} Your BanyanVision order is ${sc.label} — #${order._id.toString().slice(-8).toUpperCase()}`,
    html: customerHtml,
  });

  console.log(`📧 Status update email sent: ${newStatus} → ${user.email}`);
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. THANK YOU / DELIVERED — extra warm email on delivery
// ═════════════════════════════════════════════════════════════════════════════
const sendThankYou = async ({ order, user }) => {
  const transporter = createTransporter();

  const html = wrap(`
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:48px;margin-bottom:8px">🙏</div>
      <div class="greeting" style="text-align:center">Thank You, ${user.name}!</div>
      <div class="subtitle" style="text-align:center">
        Your order has been delivered. We're so happy it reached you safely!<br/>
        <span class="highlight">You're a valued part of the BanyanVision family.</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🛍 What You Purchased</div>
      ${itemsHtml(order.items)}
    </div>

    <div style="background:linear-gradient(135deg,${DARK_COLOR},#3D1500);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px">
      <div style="color:rgba(255,255,255,.7);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Special Offer for You</div>
      <div style="color:#F9A825;font-family:monospace;font-size:28px;font-weight:800;letter-spacing:3px;margin-bottom:8px">BANYAN10</div>
      <div style="color:rgba(255,255,255,.8);font-size:13px">Use this code on your next order for <strong style="color:#F9A825">10% off</strong></div>
    </div>

    <div style="background:#FDF8F3;border-radius:12px;padding:20px;text-align:center;border:1px solid #F0E8DD;margin-bottom:20px">
      <div style="font-size:14px;font-weight:700;color:${DARK_COLOR};margin-bottom:6px">💬 Share Your Experience</div>
      <div style="font-size:13px;color:#777;margin-bottom:14px">Your honest review helps thousands of shoppers find beautiful Indian fashion.</div>
      <div class="stars">${"★".repeat(5)}</div>
      <div style="font-size:11px;color:#aaa;margin-top:6px">Visit the product page to leave your review</div>
    </div>

    <div style="text-align:center;padding:8px 0">
      <div style="font-size:13px;color:#888;margin-bottom:8px">Follow us for new arrivals, festive drops & style tips</div>
      <div style="font-size:22px;letter-spacing:8px">🥻👗📿💃</div>
    </div>
  `);

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: user.email,
    subject: `🙏 Thank You for Shopping with BanyanVision, ${user.name}!`,
    html,
  });

  console.log(`📧 Thank you email sent → ${user.email}`);
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. REVIEW ACKNOWLEDGEMENT — sent to customer after posting a review
// ═════════════════════════════════════════════════════════════════════════════
const sendReviewAck = async ({ user, product, review }) => {
  const transporter = createTransporter();

  const html = wrap(`
    <div class="greeting">Thank you for your review, ${user.name}! ⭐</div>
    <div class="subtitle">Your feedback helps the BanyanVision community discover great Indian fashion.</div>

    <div class="card">
      <div class="card-title">📝 Your Review</div>
      <div style="font-size:14px;font-weight:700;color:${DARK_COLOR};margin-bottom:6px">${product.name}</div>
      <div class="stars" style="margin-bottom:10px">${starsHtml(review.rating)}</div>
      <div style="font-size:14px;color:#555;font-style:italic;line-height:1.7;background:#fff;border-left:3px solid ${BRAND_COLOR};padding:10px 14px;border-radius:0 8px 8px 0">
        "${review.comment}"
      </div>
      ${review.verified ? `<div style="margin-top:10px;display:inline-block;padding:4px 12px;background:#F0FDF4;color:#16A34A;border-radius:99px;font-size:11px;font-weight:700">✅ Verified Purchase</div>` : ""}
    </div>

    <div style="background:linear-gradient(135deg,${DARK_COLOR},#3D1500);border-radius:14px;padding:20px;text-align:center;margin-bottom:20px">
      <div style="color:rgba(255,255,255,.75);font-size:12px;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Reviewer Reward</div>
      <div style="color:#F9A825;font-family:monospace;font-size:24px;font-weight:800;letter-spacing:3px">BANYAN10</div>
      <div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:6px">10% off on your next order — our thanks for sharing!</div>
    </div>

    <div style="font-size:13px;color:#777;text-align:center;line-height:1.8">
      Your review will be visible on the product page shortly.<br/>
      Keep shopping and keep inspiring! 💫
    </div>
  `);

  // Also notify admin about new review
  const adminHtml = wrap(`
    <div class="greeting">⭐ New Product Review</div>
    <div class="subtitle">A customer has left a review on BanyanVision.</div>
    <div class="card">
      <div class="card-title">Review Details</div>
      <div class="row"><span class="row-label">Customer</span><span class="row-value">${user.name}</span></div>
      <div class="row"><span class="row-label">Email</span><span class="row-value">${user.email}</span></div>
      <div class="row"><span class="row-label">Product</span><span class="row-value">${product.name}</span></div>
      <div class="row"><span class="row-label">Rating</span><span class="row-value">${starsHtml(review.rating)} (${review.rating}/5)</span></div>
      <div class="row"><span class="row-label">Verified</span><span class="row-value">${review.verified ? "✅ Yes" : "No"}</span></div>
    </div>
    <div class="card">
      <div class="card-title">Comment</div>
      <div style="font-size:13px;color:#333;font-style:italic;line-height:1.7">"${review.comment}"</div>
    </div>
  `);

  await transporter.sendMail({ from: FROM_ADDRESS, to: user.email,   subject: `⭐ Thanks for your review on BanyanVision!`, html });
  await transporter.sendMail({ from: FROM_ADDRESS, to: ADMIN_EMAIL,  subject: `⭐ New Review: ${product.name} — ${review.rating}/5 by ${user.name}`, html: adminHtml });

  console.log(`📧 Review acknowledgement sent → ${user.email}`);
};

// ─── Safe wrapper (never crash the main flow if email fails) ──────────────────
const sendSafe = (fn, args) => {
  fn(args).catch(err => console.error("📧 Email error:", err.message));
};


// ═════════════════════════════════════════════════════════════════════════════
// 5. ORDERS EXPORT EMAIL — sends CSV attachment to admin
// ═════════════════════════════════════════════════════════════════════════════
const sendOrdersExportEmail = async ({ orders, statusFilter, adminEmail }) => {
  const transporter = createTransporter();

  // Build CSV content
  const headers = [
    "Order ID","Date","Customer Name","Customer Email","Phone",
    "Items","Subtotal","Discount","Shipping","Total",
    "Payment","Status","Coupon",
    "Full Name","Address","City","State","PIN"
  ];

  const rows = orders.map(ord => {
    const sa = ord.shippingAddress || {};
    const items = ord.items.map(i => `${i.name}(x${i.qty})`).join(" | ");
    const escape = v => `"${String(v||"").replace(/"/g,'""')}"`;
    return [
      escape(ord._id.toString().slice(-8).toUpperCase()),
      escape(new Date(ord.createdAt).toLocaleString("en-IN")),
      escape(ord.user?.name  || ""),
      escape(ord.user?.email || ""),
      escape(sa.phone  || ""),
      escape(items),
      escape(ord.subtotal || ord.total),
      escape(ord.discount  || 0),
      escape(ord.shipping  || 0),
      escape(ord.total),
      escape(ord.paymentId ? "Razorpay" : "COD"),
      escape(ord.status),
      escape(ord.coupon || ""),
      escape(sa.fullName || ""),
      escape(sa.address  || ""),
      escape(sa.city     || ""),
      escape(sa.state    || ""),
      escape(sa.pin      || ""),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g,"-");
  const filename = `BanyanVision_Orders_${statusFilter}_${dateStr}.csv`;

  // Summary stats for email body
  const total   = orders.length;
  const revenue = orders.reduce((s,o) => s+(o.total||0), 0);
  const byStatus = {};
  orders.forEach(o => { byStatus[o.status] = (byStatus[o.status]||0) + 1; });

  const statusRows = Object.entries(byStatus)
    .map(([s,c]) => `<div class="row"><span class="row-label" style="text-transform:capitalize">${s}</span><span class="row-value">${c} orders</span></div>`)
    .join("");

  const html = wrap(`
    <div class="greeting">📊 Orders Export Ready</div>
    <div class="subtitle">
      Your BanyanVision orders export is attached as a CSV file.<br/>
      Filter applied: <strong style="color:#C2185B">${statusFilter === "all" ? "All Orders" : statusFilter.toUpperCase()}</strong>
    </div>

    <div class="total-bar">
      <div><div class="total-label">Total Orders Exported</div></div>
      <div class="total-amount">${total}</div>
    </div>

    <div class="card">
      <div class="card-title">📈 Summary</div>
      <div class="row">
        <span class="row-label">Total Revenue</span>
        <span class="row-value" style="color:${BRAND_COLOR}">${fmt(revenue)}</span>
      </div>
      <div class="row">
        <span class="row-label">Export Date</span>
        <span class="row-value">${new Date().toLocaleString("en-IN")}</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📋 Orders by Status</div>
      ${statusRows || "<div style='color:#aaa;font-size:13px'>No orders found</div>"}
    </div>

    <div style="background:#F0FDF4;border-radius:10px;padding:12px 16px;font-size:12px;color:#166534;border:1px solid #BBF7D0;margin-top:4px">
      📎 The CSV file <strong>${filename}</strong> is attached to this email.<br/>
      Open it in Excel, Google Sheets, or any spreadsheet app.
    </div>
  `);

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to:   adminEmail,
    subject: `📊 BanyanVision Orders Export — ${total} orders (${statusFilter}) · ${dateStr}`,
    html,
    attachments: [{
      filename,
      content:  Buffer.from(csv, "utf-8"),
      contentType: "text/csv; charset=utf-8",
    }],
  });

  console.log(`📧 Orders export email sent → ${adminEmail} (${total} orders)`);
};


// ─── SMTP Verify — call on server start to confirm email config works ──────────
const verifySmtp = async () => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
      console.warn("⚠️  Email: SMTP config missing in .env — emails will not send");
      return false;
    }
    const transporter = createTransporter();
    await transporter.verify();
    console.log(`✅ Email: SMTP connected (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`);
    return true;
  } catch (err) {
    console.error(`❌ Email: SMTP connection failed — ${err.message}`);
    console.error("   Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env");
    return false;
  }
};

module.exports = { sendOrderConfirmation, sendStatusUpdate, sendThankYou, sendReviewAck, sendSafe, sendOrdersExportEmail, verifySmtp };
