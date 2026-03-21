/**
 * BanyanVision — Database Sync Tool
 * ─────────────────────────────────
 * Commands:
 *   node db-sync.js status                            → show record counts in both DBs
 *   node db-sync.js push --collections=SiteConfig     → Dev → Prod  (deploy config changes)
 *   node db-sync.js push --safe                       → Dev → Prod  (safe collections only)
 *   node db-sync.js push --all                        → Dev → Prod  (everything, with warning)
 *   node db-sync.js pull --collections=Order,User     → Prod → Dev  (reproduce prod issues)
 *   node db-sync.js pull --all                        → Prod → Dev  (full prod snapshot)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline");

// ── Connection URIs ───────────────────────────────────────────────────────────
const DEV_URI  = process.env.MONGO_URI_DEV  || process.env.MONGO_URI;
const PROD_URI = process.env.MONGO_URI_PROD;

if (!DEV_URI || !PROD_URI) {
  console.error(`
❌  Missing environment variables in .env:

    MONGO_URI_DEV  = mongodb+srv://...banyanvision_dev...
    MONGO_URI_PROD = mongodb+srv://...banyanvision_prod...

    Add both to your backend/.env file and try again.
`);
  process.exit(1);
}

// ── Collection registry ───────────────────────────────────────────────────────
//   safe : can push to Prod without risk (no real customer/payment data)
//   push : allowed directions
const REGISTRY = {
  siteconfigs: { label: "SiteConfig", safe: true,  note: "Settings, promo, about, categories" },
  coupons:     { label: "Coupon",     safe: true,  note: "Coupon codes" },
  products:    { label: "Product",    safe: true,  note: "Product catalogue + images" },
  reviews:     { label: "Review",     safe: true,  note: "Product reviews" },
  users:       { label: "User",       safe: false, note: "Customer accounts — careful!" },
  orders:      { label: "Order",      safe: false, note: "Real orders — pull only!" },
};

const SAFE_COLS  = Object.keys(REGISTRY).filter(k => REGISTRY[k].safe);
const ALL_COLS   = Object.keys(REGISTRY);

// ── Parse CLI arguments ───────────────────────────────────────────────────────
const [,, command, ...flags] = process.argv;
const hasAll     = flags.includes("--all");
const hasSafe    = flags.includes("--safe");
const colFlag    = flags.find(f => f.startsWith("--collections="));
const colNames   = colFlag
  ? colFlag.replace("--collections=", "").split(",")
      .map(s => s.trim().toLowerCase() + (s.toLowerCase().endsWith("s") ? "" : "s"))
  : hasAll  ? ALL_COLS
  : hasSafe ? SAFE_COLS
  : null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const ask = (q) => new Promise(res => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, ans => { rl.close(); res(ans.trim()); });
});

const line = (char = "─", len = 60) => char.repeat(len);
const pad  = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);

// ── Connect to a MongoDB URI ──────────────────────────────────────────────────
async function connect(uri, label) {
  const conn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 8000,
  }).asPromise();
  console.log(`  ✓  Connected → ${label}`);
  return conn;
}

// ── STATUS ────────────────────────────────────────────────────────────────────
async function showStatus(devConn, prodConn) {
  console.log(`\n  ${pad("Collection", 14)} ${pad("Safe?", 7)} ${rpad("Dev DB", 10)} ${rpad("Prod DB", 10)}  Notes`);
  console.log("  " + line());
  for (const [col, meta] of Object.entries(REGISTRY)) {
    const devCount  = await devConn.collection(col).countDocuments();
    const prodCount = await prodConn.collection(col).countDocuments();
    const safe = meta.safe ? "  ✅  " : "  ⚠️  ";
    console.log(`  ${pad(meta.label, 14)} ${safe}   ${rpad(devCount, 8)}   ${rpad(prodCount, 8)}  ${meta.note}`);
  }
  console.log("");
}

// ── SYNC ──────────────────────────────────────────────────────────────────────
async function syncCollections(srcConn, tgtConn, srcLabel, tgtLabel, collections) {
  console.log(`\n  Direction : ${srcLabel}  →  ${tgtLabel}`);
  console.log(`  Collections: ${collections.join(", ")}\n`);

  // Warn if syncing unsafe collections TO Prod
  const unsafe = collections.filter(c => !REGISTRY[c]?.safe);
  if (unsafe.length && tgtLabel.includes("PROD")) {
    console.log(`  ⚠️   WARNING: These collections contain real customer/payment data:`);
    unsafe.forEach(c => console.log(`       • ${REGISTRY[c]?.label} — ${REGISTRY[c]?.note}`));
    const confirm = await ask("\n  Type  YES  to confirm overwriting production data: ");
    if (confirm !== "YES") {
      console.log("\n  ❌  Cancelled — production data unchanged.\n");
      process.exit(0);
    }
  }

  console.log("");
  let total = 0;
  for (const col of collections) {
    if (!REGISTRY[col]) {
      console.log(`  ⚠️   Unknown collection "${col}" — skipping`);
      continue;
    }
    const src = srcConn.collection(col);
    const tgt = tgtConn.collection(col);
    const docs = await src.find({}).toArray();
    if (docs.length === 0) {
      console.log(`  ─   ${pad(REGISTRY[col].label, 14)} 0 documents — skipping`);
      continue;
    }
    await tgt.deleteMany({});
    await tgt.insertMany(docs);
    console.log(`  ✓   ${pad(REGISTRY[col].label, 14)} ${docs.length} documents copied`);
    total += docs.length;
  }
  console.log(`\n  ✅  Done — ${total} total documents synced.\n`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  🌿  BanyanVision — Database Sync Tool`);
  console.log(`${"═".repeat(60)}\n`);

  if (!["push", "pull", "status"].includes(command)) {
    console.log(`
  Commands:
    node db-sync.js status
    node db-sync.js push --safe                         (safe only → Prod)
    node db-sync.js push --collections=SiteConfig       (specific → Prod)
    node db-sync.js push --all                          (all → Prod, with confirm)
    node db-sync.js pull --collections=Order,User       (specific ← Prod)
    node db-sync.js pull --all                          (all ← Prod)

  Safe collections (no risk):  ${SAFE_COLS.map(c => REGISTRY[c].label).join(", ")}
  Risky collections (confirm): ${ALL_COLS.filter(c=>!REGISTRY[c].safe).map(c => REGISTRY[c].label).join(", ")}
`);
    process.exit(0);
  }

  console.log("  Connecting...");
  const devConn  = await connect(DEV_URI,  "Dev DB  (banyanvision_dev)");
  const prodConn = await connect(PROD_URI, "Prod DB (banyanvision_prod)");

  console.log("");

  if (command === "status") {
    await showStatus(devConn, prodConn);

  } else if (command === "push") {
    if (!colNames) {
      console.error("  ❌  Specify: --safe  or  --all  or  --collections=Name1,Name2\n");
      process.exit(1);
    }
    await syncCollections(devConn, prodConn, "DEV", "PROD", colNames);

  } else if (command === "pull") {
    if (!colNames) {
      console.error("  ❌  Specify: --all  or  --collections=Name1,Name2\n");
      process.exit(1);
    }
    await syncCollections(prodConn, devConn, "PROD", "DEV", colNames);
  }

  await devConn.close();
  await prodConn.close();
  process.exit(0);

})().catch(err => {
  console.error(`\n  ❌  ${err.message}\n`);
  process.exit(1);
});
