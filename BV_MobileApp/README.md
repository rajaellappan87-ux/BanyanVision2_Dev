# BanyanVision Mobile App

React Native + Expo Android app — synced with the BanyanVision website backend.

---

## Prerequisites

Install these once on your machine:

```powershell
# Node.js 18+ (already installed for website)
node --version

# Expo CLI
npm install -g expo-cli

# EAS CLI (for builds and Play Store submission)
npm install -g eas-cli
```

---

## Step 1 — Configure your Backend URL

Open `src/api/client.js` and set your Railway backend URL:

```js
// Line 7 — change this to your Railway URL
export const BASE_URL = 'https://YOUR-RAILWAY-URL.up.railway.app/api';

// For local development (use your machine's IP, NOT localhost):
// export const BASE_URL = 'http://192.168.1.X:5000/api';
```

> **Why not localhost?** Your phone is a separate device from your PC.
> Find your PC's local IP: run `ipconfig` on Windows → look for IPv4 Address under Wi-Fi.

---

## Step 2 — Install Dependencies

```powershell
cd D:\Raja\Misc\BV\BanyanVision\BV_MobileApp
npm install
```

---

## Step 3 — Generate Placeholder Assets

```powershell
node generate-assets.js
```

> Replace `src/assets/icon.png` and `src/assets/splash.png` with real artwork before Play Store submission.

---

## Step 4 — Run on Your Phone (Development)

```powershell
# Install Expo Go on your Android phone from Play Store first
npx expo start
```

Scan the QR code that appears with Expo Go. The app will load on your phone instantly.

**Make sure your phone and PC are on the same Wi-Fi network.**

---

## Step 5 — Run on Android Emulator (Optional)

```powershell
# Install Android Studio first, then create an AVD (Virtual Device)
npx expo start --android
```

---

## Project Structure

```
BV_MobileApp/
├── App.js                          ← Root entry — all providers
├── app.json                        ← Expo config (package name, icons)
├── babel.config.js
├── eas.json                        ← EAS Build profiles
├── package.json
├── generate-assets.js              ← Creates placeholder PNG assets
└── src/
    ├── api/
    │   ├── client.js               ← Axios instance → Railway backend
    │   └── index.js                ← All API calls (same endpoints as website)
    ├── assets/                     ← icon.png, splash.png (replace with real ones)
    ├── components/
    │   ├── Header.js               ← Top bar with cart badge
    │   └── ProductCard.js          ← Reusable product card (grid + compact)
    ├── constants/
    │   ├── categories.js           ← Mirrors website categories exactly
    │   └── theme.js                ← Colors, fonts, spacing, shadows
    ├── context/
    │   ├── AuthContext.js          ← Login, register, JWT in SecureStore
    │   ├── CartContext.js          ← Cart with AsyncStorage persistence
    │   └── WishlistContext.js      ← Wishlist synced with backend
    ├── hooks/
    │   └── useSettings.js          ← Loads /api/config/settings (same as website)
    ├── navigation/
    │   └── index.js                ← Bottom tabs + stack navigation
    ├── screens/
    │   ├── HomeScreen.js           ← Marquee, hero, categories, featured, trending
    │   ├── ShopScreen.js           ← Browse with search, filters, pagination
    │   ├── ProductDetailScreen.js  ← Images, sizes, colours, add to cart
    │   ├── CartScreen.js           ← Cart items, coupon, price summary
    │   ├── CheckoutScreen.js       ← Address form + Razorpay payment
    │   ├── OrderSuccessScreen.js   ← Order confirmed screen
    │   ├── OrdersScreen.js         ← Order history
    │   ├── WishlistScreen.js       ← Saved products
    │   ├── ProfileScreen.js        ← Edit profile, sign out
    │   ├── LoginScreen.js          ← Sign in
    │   └── RegisterScreen.js       ← Create account
    └── utils/
        └── helpers.js              ← fmt, discPct, getImageUrl, ORDER_STATUS
```

---

## How it Syncs with the Website

The app calls the **exact same Railway backend** as the website:

| Feature          | Website                   | Mobile App                |
|------------------|---------------------------|---------------------------|
| Products         | `/api/products`           | Same endpoint             |
| Auth             | `/api/auth/login`         | Same endpoint             |
| Cart             | localStorage              | AsyncStorage (on-device)  |
| Orders           | `/api/orders`             | Same endpoint             |
| Wishlist         | `/api/wishlist`           | Same endpoint             |
| Site Settings    | `/api/config/settings`    | Same endpoint             |
| Payments         | Razorpay Web SDK          | Razorpay Android SDK      |

Admin adds a product on the website → instantly visible in the app.
Customer places order on app → visible in Admin dashboard immediately.

---

## Build for Play Store

### Step 1 — Create Expo account
```powershell
eas login
```

### Step 2 — Configure project
```powershell
eas build:configure
```

### Step 3 — Build APK for testing (free, installs directly on phone)
```powershell
eas build --platform android --profile preview
```

### Step 4 — Build AAB for Play Store (production)
```powershell
eas build --platform android --profile production
```

### Step 5 — Create Google Play Console account
- Go to: https://play.google.com/console
- One-time fee: ₹2,100 (~$25 USD)
- Upload your .aab file
- Fill in store listing (description, screenshots, privacy policy URL)
- Submit for review (Google takes 3–7 days for first submission)

---

## Razorpay Setup

The app uses `react-native-razorpay`. Your existing Razorpay keys from Railway work directly:

```
RAZORPAY_KEY_ID     = rzp_live_xxx   (same as website)
RAZORPAY_KEY_SECRET = xxx            (same as website)
```

No additional Razorpay setup needed — the backend creates the order and the app handles the native Android checkout UI.

---

## Common Issues

**Images not loading**
> Check `src/api/client.js` BASE_URL is correct. Use your Railway URL in production, local IP for development.

**"Network request failed"**
> Your phone and PC must be on the same Wi-Fi. Use `ipconfig` to find your PC's local IP.

**Razorpay payment screen not opening**
> `react-native-razorpay` requires a physical Android device or an emulator with Google Play Services.

**Cart empty after refresh**
> Cart is persisted in AsyncStorage. If it clears, check `src/context/CartContext.js` AsyncStorage keys.
