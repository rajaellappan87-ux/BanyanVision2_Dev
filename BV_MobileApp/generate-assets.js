#!/usr/bin/env node
/**
 * BanyanVision — Generate placeholder assets
 * Run: node generate-assets.js
 * 
 * This creates placeholder PNG files for icon and splash.
 * Replace with your real BanyanVision branding before Play Store submission.
 */

const fs   = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'src', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// Minimal valid 1x1 transparent PNG (base64)
// Replace these with real 1024x1024 icon.png and 1284x2778 splash.png
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const files = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
files.forEach(f => {
  const fpath = path.join(assetsDir, f);
  if (!fs.existsSync(fpath)) {
    fs.writeFileSync(fpath, PLACEHOLDER_PNG);
    console.log(`Created placeholder: src/assets/${f}`);
  } else {
    console.log(`Already exists:      src/assets/${f}`);
  }
});

console.log('\n⚠️  These are placeholder 1×1 PNGs.');
console.log('   Replace with real artwork before Play Store submission:');
console.log('   icon.png          → 1024×1024 px, no rounded corners (Google adds them)');
console.log('   splash.png        → 1284×2778 px, centred logo on #FDF8F3 background');
console.log('   adaptive-icon.png → 1024×1024 px foreground only (transparent bg)');
