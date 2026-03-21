/**
 * BanyanVision — Migrate data from test/old DB → dev + prod
 *
 * Run: node migrate-test-db.js
 *
 * This copies all real data (products with Cloudinary images, users, orders etc.)
 * from the old/test database to banyanvision_dev and banyanvision_prod
 */

require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline");

const ask = (q) => new Promise(res => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, ans => { rl.close(); res(ans.trim()); });
});

// ── Build URIs for all three databases ───────────────────────────────────────
const BASE_URI = process.env.MONGO_URI || "";

// Extract the host part — everything before the database name
// e.g. mongodb+srv://user:pass@bvcluster.trz2env.mongodb.net/
const hostMatch = BASE_URI.match(/^(mongodb(?:\+srv)?:\/\/[^/]+\/)/);
const HOST = hostMatch ? hostMatch[1] : null;

// Also try to extract from the correct format
const srvMatch = BASE_URI.match(/^(mongodb(?:\+srv)?:\/\/[^@]+@[^/]+\/)/);
const HOST2 = srvMatch ? srvMatch[1] : null;

const QUERY = BASE_URI.includes("?") ? "?" + BASE_URI.split("?").slice(1).join("?") : "?retryWrites=true&w=majority&appName=BVCluster";

console.log("\n═══════════════════════════════════════════════════════════");
console.log("  BanyanVision — Database Migration Tool");
console.log("═══════════════════════════════════════════════════════════\n");
console.log("  Current MONGO_URI:", BASE_URI.replace(/:([^@:]+)@/, ":****@"));
console.log("  Extracted host:   ", HOST2 || HOST || "NOT FOUND");

if (!HOST2 && !HOST) {
  console.error("\n  ❌ Cannot parse MONGO_URI. Make sure your .env has:");
  console.error("     MONGO_URI=mongodb+srv://user:pass@bvcluster.trz2env.mongodb.net/banyanvision_dev?retryWrites=true&w=majority&appName=BVCluster\n");
  process.exit(1);
}

const BASE_HOST = HOST2 || HOST;

// ── Connect helper ────────────────────────────────────────────────────────────
async function connect(dbName) {
  const uri = `${BASE_HOST}${dbName}${QUERY}`;
  console.log(`  Connecting to: ${dbName}...`);
  const conn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();
  console.log(`  ✅ Connected → ${dbName} (${await conn.db.collection("products").countDocuments()} products)`);
  return conn;
}

// ── Copy one collection ───────────────────────────────────────────────────────
async function copyCollection(srcConn, tgtConn, colName, overwrite = true) {
  const src  = srcConn.db.collection(colName);
  const tgt  = tgtConn.db.collection(colName);
  const docs = await src.find({}).toArray();

  if (docs.length === 0) {
    console.log(`    ─  ${colName.padEnd(16)} 0 docs — skipping`);
    return 0;
  }

  if (overwrite) await tgt.deleteMany({});
  await tgt.insertMany(docs, { ordered: false }).catch(() => {});
  console.log(`    ✓  ${colName.padEnd(16)} ${docs.length} docs copied`);
  return docs.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {

  // Step 1 — ask which DB has real data
  console.log("\n  Step 1 — Which database has your real products with images?");
  console.log("  (Check MongoDB Atlas → Browse Collections to find it)\n");
  console.log("  Common names: test, banyanvision, bv, default, myapp\n");

  const srcName = await ask("  Enter SOURCE database name (the one with real data): ");
  if (!srcName) { console.error("  ❌ Cancelled"); process.exit(0); }

  // Step 2 — connect to all three
  console.log("\n  Connecting to databases...\n");
  let srcConn, devConn, prodConn;

  try { srcConn  = await connect(srcName);           } catch(e) { console.error("  ❌ Source DB failed:", e.message); process.exit(1); }
  try { devConn  = await connect("banyanvision_dev"); } catch(e) { console.error("  ❌ Dev DB failed:",    e.message); process.exit(1); }
  try { prodConn = await connect("banyanvision_prod");} catch(e) { console.error("  ❌ Prod DB failed:",   e.message); process.exit(1); }

  // Step 3 — show what's in source
  console.log("\n  Source database contents:");
  const cols = ["products","users","orders","coupons","siteconfigs","reviews"];
  const counts = {};
  for (const col of cols) {
    try {
      counts[col] = await srcConn.db.collection(col).countDocuments();
      console.log(`    ${col.padEnd(16)} ${counts[col]} documents`);
    } catch { counts[col] = 0; }
  }

  // Step 4 — confirm
  console.log("\n  This will copy the above data to:");
  console.log("    → banyanvision_dev  (your local dev database)");
  console.log("    → banyanvision_prod (your production database)");
  console.log("\n  ⚠️  Existing data in dev and prod will be OVERWRITTEN.");
  const confirm = await ask("\n  Type YES to continue: ");
  if (confirm !== "YES") { console.log("  ❌ Cancelled — no data changed.\n"); process.exit(0); }

  // Step 5 — copy to dev
  console.log("\n  Copying to banyanvision_dev...");
  for (const col of cols) {
    if (counts[col] > 0) await copyCollection(srcConn, devConn, col);
  }

  // Step 6 — copy to prod (safe collections only — no orders/users by default)
  console.log("\n  Copying to banyanvision_prod (safe collections only)...");
  const safeCols = ["products","coupons","siteconfigs","reviews"];
  for (const col of safeCols) {
    if (counts[col] > 0) await copyCollection(srcConn, prodConn, col);
  }

  // Ask about users and orders for prod
  const copyUsers = await ask("\n  Copy Users to prod too? (y/n): ");
  if (copyUsers.toLowerCase() === "y" && counts["users"] > 0) {
    await copyCollection(srcConn, prodConn, "users");
  }

  const copyOrders = await ask("  Copy Orders to prod too? (y/n): ");
  if (copyOrders.toLowerCase() === "y" && counts["orders"] > 0) {
    await copyCollection(srcConn, prodConn, "orders");
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ✅ Migration complete!");
  console.log("\n  Next steps:");
  console.log("  1. Restart your backend: npm run dev");
  console.log("  2. Check images load at localhost:3000");
  console.log("  3. Deploy to Railway — prod DB has your real products now");
  console.log("═══════════════════════════════════════════════════════════\n");

  await srcConn.close();
  await devConn.close();
  await prodConn.close();
  process.exit(0);

})().catch(err => {
  console.error("\n  ❌ Error:", err.message, "\n");
  process.exit(1);
});
