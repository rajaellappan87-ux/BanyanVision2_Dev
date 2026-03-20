import React from "react";
import { Ic } from "../utils/helpers";
import { Palette, Leaf, Zap, CheckCircle } from "lucide-react";

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
  phone:       "",           // admin must fill in real number
  whatsapp:    "",           // admin must fill in real number (format: 919XXXXXXXXXX)
  whatsappMsg: "Hi BanyanVision! I need help.",
  email:       "",           // admin must fill in real email
  address:     "",
  gst:         "",
  instagram:   "",
  facebook:    "",
  youtube:     "",
  twitter:     "",
  mapUrl:      "",
};

export const SETTINGS_KEY = "bv_settings_v1";
