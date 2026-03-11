# 🌿 BanyanVision Fashion — Full Stack Platform

India's finest handcrafted fashion store — built with **MongoDB + Express + React + Node.js** (MERN stack), real **Razorpay** payments, and **Cloudinary** image hosting.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Axios, Custom Hooks |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Payments** | Razorpay (real API — signature verified server-side) |
| **Images** | Cloudinary CDN (multi-image upload per product) |
| **Auth** | JWT (JSON Web Tokens) + bcrypt password hashing |
| **Hosting** | Any Node host (Railway, Render, Vercel + Railway) |

---

## 📁 Project Structure

```
banyan/
├── backend/
│   ├── server.js        # Express app entry point + DB seed
│   ├── models.js        # Mongoose models (User, Product, Review, Order, Coupon)
│   ├── routes.js        # All API route handlers
│   ├── middleware.js    # JWT auth, Cloudinary/Multer upload, error handler
│   ├── .env.example     # Environment variable template
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx              # All pages + components (single-file React app)
    │   ├── index.js             # React entry point
    │   ├── api.js               # All Axios API calls
    │   ├── context/
    │   │   ├── AuthContext.js   # User auth state
    │   │   └── CartContext.js   # Cart + coupon state
    │   └── hooks/
    │       └── index.js         # useBreakpoint, useToast
    └── package.json
```

---

## ⚙️ Setup Instructions

### Step 1 — Clone & Install

```bash
# Backend
cd banyan/backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### Step 2 — Create Accounts (all free tiers work)

#### 🍃 MongoDB Atlas
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) → Create free cluster
2. Database Access → Add user (username + password) rajaellappan87_db_user + OEwwLVpSwjkMm6Ty
3. Network Access → Allow from anywhere (`0.0.0.0/0`) 49.204.117.47
4. Clusters → Connect → Drivers → Copy connection string
mongodb+srv://rajaellappan87_db_user:OEwwLVpSwjkMm6Ty@bvcluster.trz2env.mongodb.net/?appName=BVCluster

#### ☁️ Cloudinary
1. Go to [https://cloudinary.com](https://cloudinary.com) → Sign up free
2. Dashboard → Copy **Cloud Name**, **API Key**, **API Secret**
dnztymvmi
587113463766312
y53fNvZRyjvhv3r6_vTRy6RvDN8
CLOUDINARY_URL=cloudinary://587113463766312:y53fNvZRyjvhv3r6_vTRy6RvDN8@dnztymvmi

#### 💳 Razorpay
1. Go to [https://razorpay.com](https://razorpay.com) → Create account
2. Settings → API Keys → Generate Test Keys
3. Copy **Key ID** and **Key Secret**
4. For live payments, complete KYC and switch to Live keys
key_id,key_secret
rzp_test_SNExtJGLL5lkt9,CnVEYZnq4MpQKsBPQ6jR5dOK

---

### Step 3 — Configure Environment

```bash
cd banyan/backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/banyanvision

JWT_SECRET=pick_any_long_random_string_here
JWT_EXPIRE=7d

RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

CLIENT_URL=http://localhost:3000
```

---

### Step 4 — Run the App

```bash
# Terminal 1 — Backend
cd banyan/backend
npm run dev        # nodemon auto-restarts on changes
# Server starts on http://localhost:5000

# Terminal 2 — Frontend
cd banyan/frontend
npm start          # React dev server
# App opens at http://localhost:3000
```

The backend **auto-seeds** the database on first run:
- Admin user: `admin@banyanvision.com` / `admin123`
- Demo user: `user@test.com` / `user123`
- 6 sample products with placeholder images
- 5 discount coupons

---

## 🌟 Features

### 🛍️ Customer Features
- **Browse & Search** — filter by category, price, sort by rating/newest/price
- **Real Product Images** — multiple photos per product with gallery & dot navigation
- **Product Details** — size guide, colour picker, stock count, reviews
- **Cart** — add/remove items, update quantity, persistent coupon codes
- **Checkout** — real Razorpay payment (UPI, Card, NetBanking, Wallets, EMI)
- **Payment Verification** — HMAC-SHA256 signature verified server-side
- **Orders** — full order history with real-time status
- **Wishlist** — saved to MongoDB, synced across devices
- **Reviews** — star ratings, verified purchase badge, helpful votes
- **Profile** — editable name, phone, address

### 👑 Admin Features
- **Dashboard** — revenue, orders, user count, recent activity
- **Multi-Image Upload** — upload up to 6 images per product via Cloudinary CDN
  - Drag & drop preview before upload
  - Delete individual images (removed from Cloudinary too)
  - Images automatically optimized & CDN-served
- **Product CRUD** — create, edit, delete products with full details
- **Order Management** — update order status (triggers email in future)
- **Customer List** — all registered users with role badges
- **Analytics** — revenue by category, order status breakdown, top products
- **Coupon Manager** — create/delete discount codes (% or flat)

### 🔒 Security
- Passwords hashed with bcrypt (salt rounds: 12)
- JWT tokens expire in 7 days
- Razorpay payment verified with HMAC-SHA256 server-side
- Admin-only routes protected with middleware
- CORS restricted to `CLIENT_URL`

---

## 🌐 API Reference

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login → JWT token
GET    /api/auth/me                Get current user (auth required)
PUT    /api/auth/profile           Update profile

GET    /api/products               List products (filters, sort, pagination)
GET    /api/products/:id           Get product + reviews
POST   /api/products               Create product [ADMIN] (multipart/form-data)
PUT    /api/products/:id           Update product [ADMIN] (multipart/form-data)
DELETE /api/products/:id           Delete product + Cloudinary images [ADMIN]
DELETE /api/products/:id/images/:public_id   Remove single image [ADMIN]

POST   /api/reviews                Submit review (auth required)
PUT    /api/reviews/:id/helpful    Mark review helpful

POST   /api/orders/create-payment  Create Razorpay order → get orderId
POST   /api/orders                 Verify payment + create order
GET    /api/orders/my              User's orders
GET    /api/orders                 All orders [ADMIN]
PUT    /api/orders/:id/status      Update status [ADMIN]

POST   /api/wishlist/toggle        Toggle product in wishlist
GET    /api/wishlist               Get wishlist products

POST   /api/coupons/validate       Validate coupon code
GET    /api/coupons                All coupons [ADMIN]
POST   /api/coupons                Create coupon [ADMIN]
DELETE /api/coupons/:id            Delete coupon [ADMIN]

GET    /api/admin/stats            Dashboard analytics [ADMIN]
GET    /api/admin/users            All users [ADMIN]

GET    /api/health                 Health check
```

---

## 🚀 Deployment

### Backend → Railway / Render
1. Push code to GitHub
2. Connect repo → set environment variables from `.env`
3. Deploy — Railway/Render auto-detects `npm start`

### Frontend → Vercel / Netlify
1. Change `proxy` in `frontend/package.json` to your backend URL
2. Or set `REACT_APP_API_URL=https://your-backend.railway.app` and update `api.js`
3. Push to GitHub → connect to Vercel → deploy

---

## 🧪 Testing Payments

Use Razorpay test credentials and these test card details:
- **Card:** `4111 1111 1111 1111` · Expiry: any future · CVV: any
- **UPI:** `success@razorpay`
- **NetBanking:** any bank → test credentials shown on Razorpay page

---

## 📋 Default Coupon Codes

| Code | Discount |
|---|---|
| `BANYAN10` | 10% off |
| `WELCOME20` | 20% off |
| `FESTIVE15` | 15% off |
| `FLAT500` | ₹500 off (min ₹3000) |
| `BRIDAL30` | 30% off |
