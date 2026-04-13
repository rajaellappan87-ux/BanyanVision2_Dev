/**
 * BV_Plaza/backend/plazaModels.js
 * MongoDB schemas for BV Plaza marketplace
 * NOTE: autoIndex: false on all schemas to prevent Atlas timeout on first access.
 *       Uniqueness is enforced at the application level in routes.
 */
const path = require("path");
const mongoose = require(path.join(__dirname, "..", "..", "backend", "node_modules", "mongoose"));
const { Schema } = mongoose;

const opts = { timestamps: true, autoIndex: false, autoCreate: false };

// ─── Stall ────────────────────────────────────────────────────────────────────
const StallSchema = new Schema({
  owner:       { type: Schema.Types.ObjectId, ref: "User", required: true },
  shopName:    { type: String, required: true, trim: true },
  description: { type: String, maxlength: 500, default: "" },
  logo:        { url: String, public_id: String },
  categories:  [String],

  isOnline:          { type: Boolean, default: false },
  lastHeartbeat:     { type: Date,    default: Date.now },

  subscriptionStatus: { type: String, enum: ["trial","active","expired","cancelled"], default: "trial" },
  subscriptionPlan:   { type: String, enum: ["monthly","yearly"], default: "monthly" },
  trialStartDate:     { type: Date, default: Date.now },
  trialEndDate:       Date,
  subscriptionStart:  Date,
  nextBillingDate:    Date,

  returnPolicy:    { type: String, default: "7 days return policy" },
  deliveryDays:    { type: Number, default: 5 },

  rating:          { type: Number, default: 0 },
  numReviews:      { type: Number, default: 0 },
  totalSales:      { type: Number, default: 0 },

  isActive:        { type: Boolean, default: true },
  isVerified:      { type: Boolean, default: false },
  termsAccepted:   { type: Boolean, default: false },
  bankDetailsAdded:{ type: Boolean, default: false },
}, opts);

// ─── PlazaProduct ─────────────────────────────────────────────────────────────
const PlazaProductSchema = new Schema({
  stall:         { type: Schema.Types.ObjectId, ref: "Stall", required: true },
  owner:         { type: Schema.Types.ObjectId, ref: "User",  required: true },
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: "" },
  price:         { type: Number, required: true, min: 0 },
  originalPrice: { type: Number },
  category:      { type: String, default: "General" },
  images:        [{ url: String, public_id: String }],
  videoUrl:      { type: String, default: "" },
  stock:         { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  tags:          [String],
}, opts);

// ─── StallCoupon ─────────────────────────────────────────────────────────────
const StallCouponSchema = new Schema({
  stall:    { type: Schema.Types.ObjectId, ref: "Stall", required: true },
  code:     { type: String, required: true, uppercase: true, trim: true },
  type:     { type: String, enum: ["percent","flat"], default: "percent" },
  discount: { type: Number, required: true },
  minOrder: { type: Number, default: 0 },
  active:   { type: Boolean, default: true },
  expiresAt:Date,
  usedCount:{ type: Number, default: 0 },
}, opts);

// ─── BankDetail ──────────────────────────────────────────────────────────────
const BankDetailSchema = new Schema({
  owner:               { type: Schema.Types.ObjectId, ref: "User", required: true },
  stall:               { type: Schema.Types.ObjectId, ref: "Stall" },
  accountHolderName:   { type: String, required: true },
  accountNumber:       { type: String, required: true },
  confirmAccountNumber:{ type: String },
  ifscCode:            { type: String, required: true, uppercase: true },
  bankName:            { type: String, required: true },
  branchName:          { type: String, default: "" },
  upiId:               { type: String, default: "" },
  isVerified:          { type: Boolean, default: false },
}, opts);

// ─── Wallet ──────────────────────────────────────────────────────────────────
const WalletSchema = new Schema({
  owner:          { type: Schema.Types.ObjectId, ref: "User", required: true },
  stall:          { type: Schema.Types.ObjectId, ref: "Stall" },
  balance:        { type: Number, default: 0 },
  totalEarned:    { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
}, opts);

// ─── WalletTransaction ───────────────────────────────────────────────────────
const WalletTransactionSchema = new Schema({
  wallet:      { type: Schema.Types.ObjectId, ref: "Wallet",  required: true },
  owner:       { type: Schema.Types.ObjectId, ref: "User" },
  type:        { type: String, enum: ["credit","debit","withdrawal","fee"], required: true },
  amount:      { type: Number, required: true },
  description: { type: String, default: "" },
  status:      { type: String, enum: ["pending","completed","failed"], default: "completed" },
  referenceId: { type: String, default: "" },
}, opts);

// ─── PlazaOrder ──────────────────────────────────────────────────────────────
const PlazaOrderSchema = new Schema({
  buyer:   { type: Schema.Types.ObjectId, ref: "User",  required: true },
  stall:   { type: Schema.Types.ObjectId, ref: "Stall", required: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: "PlazaProduct" },
    name:    String,
    price:   Number,
    qty:     Number,
    image:   String,
  }],
  subtotal:        Number,
  discountAmount:  { type: Number, default: 0 },
  total:           Number,
  couponUsed:      { type: String, default: "" },
  status:          { type: String, enum: ["pending","confirmed","shipped","delivered","cancelled"], default: "pending" },
  shippingAddress: {
    fullName: String,
    phone:    String,
    address:  String,
    city:     String,
    state:    String,
    pin:      String,
  },
  paymentId:       { type: String, default: "" },
  isPaid:          { type: Boolean, default: false },
}, opts);

// ─── PlazaChat ───────────────────────────────────────────────────────────────
const PlazaChatSchema = new Schema({
  stall:       { type: Schema.Types.ObjectId, ref: "Stall", required: true },
  sessionId:   { type: String, required: true },
  sender:      { type: Schema.Types.ObjectId, ref: "User" },
  senderName:  { type: String, default: "Guest" },
  senderType:  { type: String, enum: ["buyer","shopowner"], required: true },
  messageType: { type: String, enum: ["text","voice","product","image"], default: "text" },
  content:     { type: String, default: "" },
  productId:   { type: Schema.Types.ObjectId, ref: "PlazaProduct" },
  isRead:      { type: Boolean, default: false },
}, opts);

// ─── Withdrawal ──────────────────────────────────────────────────────────────
const WithdrawalSchema = new Schema({
  owner:            { type: Schema.Types.ObjectId, ref: "User",       required: true },
  wallet:           { type: Schema.Types.ObjectId, ref: "Wallet" },
  bankDetail:       { type: Schema.Types.ObjectId, ref: "BankDetail" },
  requestedAmount:  { type: Number, required: true },
  processingFee:    Number,
  netAmount:        Number,
  bvCreditAmount:   Number,
  status:           { type: String, enum: ["pending","processing","completed","rejected"], default: "pending" },
  remarks:          { type: String, default: "" },
  processedAt:      Date,
}, opts);

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  Stall:              mongoose.model("Stall",              StallSchema),
  PlazaProduct:       mongoose.model("PlazaProduct",       PlazaProductSchema),
  StallCoupon:        mongoose.model("StallCoupon",        StallCouponSchema),
  BankDetail:         mongoose.model("BankDetail",         BankDetailSchema),
  Wallet:             mongoose.model("Wallet",             WalletSchema),
  WalletTransaction:  mongoose.model("WalletTransaction",  WalletTransactionSchema),
  PlazaOrder:         mongoose.model("PlazaOrder",         PlazaOrderSchema),
  PlazaChat:          mongoose.model("PlazaChat",          PlazaChatSchema),
  Withdrawal:         mongoose.model("Withdrawal",         WithdrawalSchema),
};
