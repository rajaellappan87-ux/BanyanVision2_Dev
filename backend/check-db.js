/**
 * BanyanVision — DB Connection Checker
 * Run locally: node check-db.js
 * Run on Railway: add to start command temporarily
 *
 * Shows EXACTLY which database is connected and what data is in it.
 */
require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error("❌ MONGO_URI not set"); process.exit(1); }

  // Extract DB name from URI safely
  const match = uri.match(/\.mongodb\.net\/([^?]+)/);
  const dbName = match ? match[1] : "unknown";

  console.log("\n══════════════════════════════════════════");
  console.log("  BanyanVision — Database Connection Check");
  console.log("══════════════════════════════════════════");
  console.log(`\n  NODE_ENV : ${process.env.NODE_ENV || "not set"}`);
  console.log(`  Database : ${dbName}`);

  if (dbName.includes("dev")) {
    console.log("  Status   : ❌ DEV database — wrong for production!");
    console.log("\n  ► Fix: In Railway Variables, change MONGO_URI to end with");
    console.log("         banyanvision_prod?retryWrites=true&w=majority");
  } else if (dbName.includes("prod")) {
    console.log("  Status   : ✅ PROD database — correct");
  } else {
    console.log(`  Status   : ⚠️  Unknown DB name: ${dbName}`);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    console.log("\n  ── Collection counts ──────────────────");

    const cols = ["users","orders","products","coupons","siteconfigs","logs"];
    for (const col of cols) {
      try {
        const count = await db.collection(col).countDocuments();
        console.log(`  ${col.padEnd(16)} ${String(count).padStart(6)} documents`);
      } catch {}
    }

    // Show last 3 orders
    const orders = await db.collection("orders")
      .find({}).sort({ createdAt: -1 }).limit(3).toArray();

    console.log("\n  ── Last 3 orders ──────────────────────");
    if (!orders.length) {
      console.log("  (no orders in this database)");
    } else {
      orders.forEach(o => {
        const date = new Date(o.createdAt).toLocaleString("en-IN");
        console.log(`  #${o._id.toString().slice(-8).toUpperCase().padEnd(10)} ₹${String(o.total).padStart(7)}  ${(o.status||"").padEnd(12)} ${date}`);
      });
    }

  } catch (err) {
    console.error(`\n  ❌ Connection failed: ${err.message}`);
  }

  console.log("\n══════════════════════════════════════════\n");
  process.exit(0);
})();
