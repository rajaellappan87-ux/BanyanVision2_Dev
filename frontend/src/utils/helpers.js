import React from "react";
import { ShoppingBag, ShoppingCart, Heart, User, Search, Menu, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Star, StarHalf, Package, Truck, CheckCircle, Clock, XCircle, AlertCircle, AlertTriangle, Settings, BarChart2, Tag, Gift, Users, UserPlus, Shield, Eye, EyeOff, Edit, Trash2, Plus, Minus, Mail, Phone, MapPin, Lock, RefreshCw, Upload, Download, Printer, Send, FileText, LayoutDashboard, TrendingUp, Layers, Scissors, Crop, ZoomIn, Check, Save, LogOut, Home, Leaf, Zap, Globe, CreditCard, Warehouse, Archive, PlusCircle, ExternalLink, Palette, Shirt, Info as InfoIcon,  } from "lucide-react";

// ─── Icon helper ──────────────────────────────────────────────────────────────
export const Ic = ({ icon: Icon, size=16, color="currentColor", style={}, className="" }) =>
  <Icon size={size} color={color} style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...style}} strokeWidth={2} className={className}/>;

// ─── Icon name → component map (JSON-safe icon storage) ──────────────────────
export const ICON_MAP = {
  Palette, Leaf, Zap, CheckCircle, Star, Heart, Lock, Truck, RefreshCw,
  Package, Users, ShoppingBag, Gift, Settings, Globe, Phone, Mail, MapPin,
  Shield, TrendingUp, BarChart2,
  Warehouse, Layers, FileText, PlusCircle, Archive,
};

export const getIcon = (name, size=22, color="currentColor") => {
  const I = ICON_MAP[name];
  return I ? <Ic icon={I} size={size} color={color}/> : <span>{name}</span>;
};

// ── Brand icon components (Instagram/Facebook/Youtube/Twitter removed from lucide 0.292+) ──
export const InstagramIcon = ({ size=16, color="currentColor", style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...style}}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
export const FacebookIcon = ({ size=16, color="currentColor", style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...style}}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
export const YoutubeIcon = ({ size=16, color="currentColor", style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...style}}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
);
export const TwitterIcon = ({ size=16, color="currentColor", style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...style}}>
    <path d="M4 4l16 16M4 20L20 4"/>
  </svg>
);


// Re-export all icons for convenience
export {
  ShoppingBag, ShoppingCart, Heart, User, Search, Menu, X, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Star, StarHalf, Package, Truck, CheckCircle, Clock,
  XCircle, AlertCircle, AlertTriangle, Settings, BarChart2, Tag, Gift,
  Users, UserPlus, Shield, Eye, EyeOff, Edit, Trash2, Plus, Minus,
  Mail, Phone, MapPin,
  Lock, RefreshCw, Upload, Download, Printer, Send, FileText, LayoutDashboard,
  TrendingUp, Layers, Scissors, Crop, ZoomIn,
  Check, Save, LogOut, Home, Leaf, Zap, Globe, CreditCard,
  Warehouse, Archive, PlusCircle,
  ExternalLink, Palette, Shirt, InfoIcon,
};

// ─── Format helpers ───────────────────────────────────────────────────────────
export const fmt  = n => "₹" + Number(n || 0).toLocaleString("en-IN");
export const disc = (orig, price) => (orig && price && orig > price) ? Math.round((1 - price/orig)*100) : 0;
export const thumb = (input) => {
  try {
    // Recursively extract a string URL from any possible input shape
    const extract = (v) => {
      if (!v) return "";
      if (typeof v === "string") return v;
      // {url: "...", public_id: "..."} — Cloudinary image object
      if (v.url)    return extract(v.url);
      // {image: "..."} or {image: {url:"..."}}
      if (v.image)  return extract(v.image);
      // {images: [...]}
      if (Array.isArray(v.images) && v.images.length)  return extract(v.images[0]);
      // plain array
      if (Array.isArray(v) && v.length) return extract(v[0]);
      // number, boolean etc — not usable
      return "";
    };

    const url = extract(input);
    if (!url || typeof url !== "string") return "";
    // Add Cloudinary auto-optimisation transform
    return url.includes("/upload/")
      ? url.replace("/upload/", "/upload/w_400,q_auto,f_auto/")
      : url;
  } catch {
    return "";
  }
};

export const COLORS_MAP = {
  "Red":"#EF4444","Pink":"#EC4899","Rose":"#F43F5E","Orange":"#F97316",
  "Yellow":"#EAB308","Green":"#22C55E","Teal":"#14B8A6","Blue":"#3B82F6",
  "Purple":"#A855F7","Navy":"#1E3A5F","Black":"#111827","White":"#F9FAFB",
  "Grey":"#6B7280","Beige":"#D2B48C","Brown":"#92400E","Gold":"#F59E0B",
  "Maroon":"#7F1D1D","Ivory":"#FFFFF0","Cream":"#FFFDD0","Saffron":"#FF9933",
  "Dusty Rose":"#C48B9F","Forest Green":"#228B22","Royal Blue":"#4169E1",
  "Midnight Black":"#191970",
};

// ─── Print shipping label ─────────────────────────────────────────────────────
export const printShippingLabel = (ord) => {
  const sa = ord.shippingAddress || {};
  const win = window.open("","_blank","width=420,height=600");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Shipping Label</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Arial',sans-serif;background:#fff;padding:0;}
  .label{width:100mm;min-height:150mm;border:2px solid #000;padding:0;margin:0 auto;position:relative;}
  .header{background:#1A0A00;color:#fff;padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:2px solid #000;}
  .logo-img{width:52px;height:52px;object-fit:contain;flex-shrink:0;}
  .brand{font-size:15px;font-weight:800;letter-spacing:.5px;}
  .brand-sub{font-size:8px;letter-spacing:2px;opacity:.6;text-transform:uppercase;}
  .section{padding:8px 14px;border-bottom:1px solid #ddd;}
  .label-sm{font-size:7px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:3px;}
  .val{font-size:12px;font-weight:700;color:#111;line-height:1.4;}
  .val-lg{font-size:14px;font-weight:800;color:#000;line-height:1.4;}
  .order-id{font-family:monospace;font-size:18px;font-weight:800;letter-spacing:2px;color:#C2185B;}
  .items-table{width:100%;border-collapse:collapse;font-size:10px;}
  .items-table th{background:#f5f5f5;padding:4px 6px;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ddd;}
  .items-table td{padding:4px 6px;border-bottom:1px dotted #eee;vertical-align:top;}
  .totals{display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;}
  .total-final{background:#1A0A00;color:#fff;display:flex;justify-content:space-between;padding:8px 14px;font-weight:800;font-size:13px;}
  .barcode{text-align:center;padding:8px;border-top:1px solid #ddd;}
  .barcode-bars{font-family:monospace;font-size:28px;letter-spacing:2px;color:#000;}
  .barcode-num{font-size:9px;letter-spacing:2px;color:#555;margin-top:2px;}
  .footer{text-align:center;padding:6px;font-size:8px;color:#888;border-top:1px solid #eee;}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.5px;}
  .fragile{border:1.5px solid #E65100;color:#E65100;}
  .handle{border:1.5px solid #2563EB;color:#2563EB;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div class="label">
  <div class="header">
    <img class="logo-img" src="${window.location.origin}/bv.jpg" alt="BanyanVision"/>
    <div>
      <div class="brand">BanyanVision</div>
      <div class="brand-sub">Empowering Dreams, Inspiring Innovations</div>
    </div>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:8px;opacity:.6">ORDER</div>
      <div style="font-family:monospace;font-size:13px;font-weight:800;letter-spacing:1px">#${ord._id.slice(-8).toUpperCase()}</div>
    </div>
  </div>
  <div class="section" style="background:#fff9f0;">
    <div class="label-sm">📦 Ship To</div>
    <div class="val-lg">${sa.fullName||"—"}</div>
    <div class="val">${sa.address||""}</div>
    <div class="val">${sa.city||""}${sa.state?", "+sa.state:""} — ${sa.pin||""}</div>
    <div class="val" style="margin-top:4px">📱 ${sa.phone||"—"}</div>
  </div>
  <div class="section">
    <div class="label-sm">📤 Ship From</div>
    <div class="val" style="font-weight:700">BanyanVision</div>
    <div class="val">www.banyanvision.com</div>
  </div>
  <div class="section">
    <div class="label-sm">🛍 Items</div>
    <table class="items-table">
      <thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>
        ${ord.items.map(it=>`<tr>
          <td>${it.name}</td>
          <td>${it.size||"—"}</td>
          <td>${it.qty}</td>
          <td>₹${Number(it.price).toLocaleString("en-IN")}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
  ${ord.discount>0?`<div class="totals"><span>Discount</span><span>−₹${Number(ord.discount).toLocaleString("en-IN")}</span></div>`:""}
  <div class="totals"><span>Delivery</span><span>${ord.shipping===0?"FREE":"₹"+Number(ord.shipping).toLocaleString("en-IN")}</span></div>
  <div class="total-final"><span>TOTAL</span><span>₹${Number(ord.total).toLocaleString("en-IN")}</span></div>
  <div class="barcode">
    <div class="barcode-bars">||||| ||| ||||| || |||</div>
    <div class="barcode-num">${ord._id.toUpperCase()}</div>
  </div>
  <div style="display:flex;gap:8px;justify-content:center;padding:6px">
    <span class="badge fragile">⚠ FRAGILE</span>
    <span class="badge handle">☝ HANDLE WITH CARE</span>
  </div>
  <div class="footer">
    Packed on: ${new Date(ord.createdAt).toLocaleDateString("en-IN")} · Payment: ${ord.paymentId?"Paid (Razorpay)":"COD"} · Thank you for shopping with BanyanVision — Empowering Dreams, Inspiring Innovations!
  </div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
};
