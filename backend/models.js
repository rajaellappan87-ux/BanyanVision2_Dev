// ─── models/User.js ───────────────────────────────────────────────────────────
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone:    { type: String, default: "" },
  address:  { type: String, default: "" },
  role:     { type: String, enum: ["user", "admin"], default: "user" },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

// ─── models/Product.js ────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, required: true },
  price:         { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: null },
  category:      { type: String, required: true },
  fabric:        { type: String, default: "" },
  occasion:      { type: String, default: "" },
  care:          { type: String, default: "" },
  sizes:         [{ type: String }],
  colors:        [{ type: String }],
  images:        [{ url: String, public_id: String }],   // Cloudinary images
  stock:         { type: Number, required: true, default: 0 },
  badge:         { type: String, default: null },
  featured:      { type: Boolean, default: false },
  trending:      { type: Boolean, default: false },
  rating:        { type: Number, default: 0 },
  numReviews:    { type: Number, default: 0 },
}, { timestamps: true });

// ─── models/Review.js ─────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, required: true },
  verified: { type: Boolean, default: false },
  helpful:  { type: Number, default: 0 },
}, { timestamps: true });

// ─── models/Order.js ──────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    product:   { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name:      String,
    image:     String,
    price:     Number,
    qty:       Number,
    size:      String,
    color:     String,
    category:  String,
  }],
  shippingAddress: {
    fullName: String,
    phone:    String,
    address:  String,
    city:     String,
    state:    String,
    pin:      String,
  },
  subtotal:   { type: Number, required: true },
  discount:   { type: Number, default: 0 },
  shipping:   { type: Number, default: 0 },
  total:      { type: Number, required: true },
  coupon:     { type: String, default: null },
  status:     { type: String, enum: ["pending","processing","shipped","delivered","cancelled"], default: "pending" },
  paymentId:       { type: String, default: null },
  paymentOrderId:  { type: String, default: null },
  paymentSignature:{ type: String, default: null },
  isPaid:          { type: Boolean, default: false },
  paidAt:          { type: Date },
}, { timestamps: true });

// ─── models/Coupon.js ─────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code:     { type: String, required: true, unique: true, uppercase: true },
  type:     { type: String, enum: ["percent", "flat"], required: true },
  discount: { type: Number, required: true },
  desc:     { type: String, required: true },
  active:   { type: Boolean, default: true },
  minOrder: { type: Number, default: 0 },
  maxUses:  { type: Number, default: null },
  usedCount:{ type: Number, default: 0 },
}, { timestamps: true });

module.exports = {
  User:    mongoose.model("User",    userSchema),
  Product: mongoose.model("Product", productSchema),
  Review:  mongoose.model("Review",  reviewSchema),
  Order:   mongoose.model("Order",   orderSchema),
  Coupon:  mongoose.model("Coupon",  couponSchema),
};
