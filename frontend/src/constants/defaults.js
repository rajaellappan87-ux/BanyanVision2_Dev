
// ─── Default Promo Banner ─────────────────────────────────────────────────────
export const DEFAULT_PROMO = {
  tag:        "⏰ Limited Time",
  heading:    "Bridal Season",
  subheading: "Up to 30% Off",
  body:       "Use code",
  code:       "BRIDAL30",
  codeDesc:   "on all lehengas, sarees & jewellery sets.",
  btnLabel:   "Shop Now",
  active:     true,
  image1:     "",
  image2:     "",
};

// ─── Default About Page ───────────────────────────────────────────────────────
export const DEFAULT_ABOUT = {
  heroLabel:          "Our Story",
  heroHeading:        "Rooted in Heritage.",
  heroHeadingAccent:  "Styled for Today.",
  heroBody:           "BanyanVision bridges India's master artisans with modern wardrobes. Every piece carries centuries of craft tradition.",
  missionLabel:       "Mission",
  missionHeading:     "Why We Exist",
  missionP1:          "Every piece on BanyanVision is handpicked from verified artisans — from Varanasi's silk lanes to Rajasthan's block-print studios.",
  missionP2:          "When you shop with us, you sustain centuries-old craft traditions and support skilled artisan communities across India.",
  emoji:              "🌿",
  features: [
    { icon: "Palette",     title: "Authentic",    desc: "Verified Indian artisans" },
    { icon: "Leaf",        title: "Sustainable",  desc: "Eco-conscious packaging" },
    { icon: "Zap",         title: "Fast Delivery",desc: "3–7 business days" },
    { icon: "CheckCircle", title: "Guaranteed",   desc: "30-day return policy" },
  ],
};

// ─── Default Site Settings ────────────────────────────────────────────────────
// These are ONLY used on the very first launch before admin saves real values.
// Once admin saves via Site Settings page, DB values are always used instead.
export const DEFAULT_SETTINGS = {
  // ── Contact ──────────────────────────────────────────────────────────────
  phone:              "",
  whatsapp:           "",
  whatsappMsg:        "Hi BanyanVision! I need help.",
  email:              "",
  address:            "",
  gst:                "",
  // ── Social ───────────────────────────────────────────────────────────────
  instagram:          "",
  facebook:           "",
  youtube:            "",
  twitter:            "",
  mapUrl:             "",
  // ── Delivery charges ─────────────────────────────────────────────────────
  shippingCharge:     99,      // ₹ charged when order is below free threshold
  freeShippingAbove:  2000,    // order value above which shipping is free (0 = always free)
  expressCharge:      199,     // ₹ for express delivery
  expressDays:        "1–2 business days",
  standardDays:       "3–5 business days",
  // ── Returns ──────────────────────────────────────────────────────────────
  returnsEnabled:     false,   // show/hide Free Returns badge everywhere
  returnDays:         7,       // return window in days
  returnType:         "Free pickup from door",
  // ── Trust badges (footer / product page) ─────────────────────────────────
  showFreeDeliveryBadge: true,
  showSecurePayBadge:    true,
  showRatingBadge:       true,
};

export const SETTINGS_KEY = "bv_settings_v1";

// ─── Default Marquee Banner Text ──────────────────────────────────────────────
export const DEFAULT_MARQUEE = {
  items: [
    "FREE SHIPPING ABOVE ₹2000",
    "WELCOME20 — 20% OFF FIRST ORDER",
    "BANARASI SILK SAREES",
    "BLOCK PRINT KURTAS",
    "HAND EMBROIDERY",
    "ZARDOZI WORK",
    "PATOLA SAREES",
    "KUNDAN JEWELLERY",
    "MIRROR WORK",
    "KALAMKARI ART",
    "BRIDAL COLLECTION NOW LIVE",
    "CRAFTED BY MASTER ARTISANS",
  ],
  separator: "✦",
  speed: 32,   // seconds for one full loop
  active: true,
};

// ─── Default Top Announcement Bar ────────────────────────────────────────────
export const DEFAULT_TOPBAR = {
  text:   "✦ FREE SHIPPING ABOVE ₹2000   ✦   WELCOME20 — 20% OFF YOUR FIRST ORDER   ✦   BRIDAL COLLECTION NOW LIVE   ✦   HANDCRAFTED BY 25+ MASTER ARTISANS",
  speed:  22,    // seconds
  active: true,
};
