# BanyanVision — Complete Deployment Guide
## Stack: Railway (backend) + Vercel (frontend) + GoDaddy (domain)

---

## PART 1 — MongoDB Atlas (database)

### 1.1 Create cluster
1. Go to https://cloud.mongodb.com
2. Create free account → New Project → "BanyanVision"
3. Build Database → Free tier (M0) → AWS → Mumbai (ap-south-1) → Create
4. Username: `banyanvision` → Auto-generate password → Copy it!
5. Add IP: `0.0.0.0/0` (allow all — Railway needs this)

### 1.2 Get connection string
1. Click Connect → Drivers → Node.js
2. Copy the string, looks like:
   `mongodb+srv://banyanvision:<password>@cluster0.xxxxx.mongodb.net/`
3. Replace `<password>` with your actual password
4. Add database name: `...mongodb.net/banyanvision?retryWrites=true&w=majority`
5. **Save this — you need it for Railway**

---

## PART 2 — Railway (backend deployment)

### 2.1 Create Railway account & project
1. Go to https://railway.app → Login with GitHub
2. New Project → Deploy from GitHub repo
3. Select: `rajaellappan87-ux/BanyanVision2_Dev`
4. Choose **Root Directory**: `backend`
5. Choose **Branch**: `prod`

### 2.2 Add all environment variables
In Railway → Your Service → Variables → Add these one by one:

```
PORT                    = 5000
NODE_ENV                = production
MONGO_URI               = mongodb+srv://banyanvision:YOURPASS@cluster0.xxxxx.mongodb.net/banyanvision?retryWrites=true&w=majority
JWT_SECRET              = [generate: type random 40+ chars e.g. bv_jwt_secret_2024_x9k2m8p1q7r3s5t6u]
JWT_EXPIRE              = 7d
RAZORPAY_KEY_ID         = rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET     = xxxxxxxxxxxxxxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME   = your_cloud_name
CLOUDINARY_API_KEY      = your_api_key
CLOUDINARY_API_SECRET   = your_api_secret
SMTP_HOST               = smtppro.zoho.in
SMTP_PORT               = 465
SMTP_SECURE             = true
SMTP_USER               = admin@yourdomain.com
SMTP_PASS               = your_zoho_app_password
EMAIL_FROM              = "BanyanVision" <admin@yourdomain.com>
ADMIN_EMAIL             = admin@yourdomain.com
CLIENT_URL              = https://www.yourdomain.com
```

### 2.3 Set custom domain on Railway
1. Railway → Your Service → Settings → Networking
2. Click "Generate Domain" — copy the URL e.g. `banyanvision-prod.up.railway.app`
3. (Optional) Add custom domain: `api.yourdomain.com` later

### 2.4 Verify backend is running
Open: `https://banyanvision-prod.up.railway.app/api/health`
Should return: `{"status":"ok","timestamp":"...","version":"1.0.0"}`

---

## PART 3 — Vercel (frontend deployment)

### 3.1 Create Vercel account & project
1. Go to https://vercel.com → Login with GitHub
2. Add New → Project → Import: `rajaellappan87-ux/BanyanVision2_Dev`
3. Configure:
   - **Framework**: Create React App
   - **Root Directory**: `frontend`
   - **Branch**: `prod`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.2 Add environment variable
In Vercel → Project → Settings → Environment Variables:

```
Name:   REACT_APP_API_URL
Value:  https://banyanvision-prod.up.railway.app/api
Target: Production, Preview, Development
```

> Replace `banyanvision-prod.up.railway.app` with your actual Railway URL from Step 2.3

### 3.3 Deploy
Click Deploy → Wait ~2 minutes → Your site is live on Vercel URL

### 3.4 Note your Vercel URL
e.g. `banyanvision.vercel.app` — you'll need this for Railway's CLIENT_URL

---

## PART 4 — GoDaddy Domain Setup

### 4.1 Update Railway CLIENT_URL
Go back to Railway → Variables → Update:
```
CLIENT_URL = https://www.yourdomain.com
```

### 4.2 Point GoDaddy domain to Vercel

**In GoDaddy → DNS Management → Add these records:**

| Type  | Name | Value                      | TTL  |
|-------|------|----------------------------|------|
| A     | @    | 76.76.19.61                | 600  |
| CNAME | www  | cname.vercel-dns.com       | 600  |

> These are Vercel's IP and CNAME — fixed for all Vercel projects

### 4.3 Add domain in Vercel
1. Vercel → Project → Settings → Domains
2. Add domain: `yourdomain.com`
3. Add domain: `www.yourdomain.com`
4. Vercel shows DNS records to add — verify they match Step 4.2
5. Wait 10–30 mins for DNS propagation
6. Vercel auto-issues SSL certificate (HTTPS)

### 4.4 (Optional) Map api subdomain to Railway
For a cleaner API URL like `api.yourdomain.com`:

**In GoDaddy DNS:**
| Type  | Name | Value                                    | TTL  |
|-------|------|------------------------------------------|------|
| CNAME | api  | banyanvision-prod.up.railway.app         | 600  |

**In Railway → Settings → Networking → Custom Domain:**
Add: `api.yourdomain.com`

Then update Vercel env var:
```
REACT_APP_API_URL = https://api.yourdomain.com/api
```

---

## PART 5 — Razorpay Live Mode

1. Login to https://dashboard.razorpay.com
2. Toggle from **Test Mode** → **Live Mode** (top right)
3. Settings → API Keys → Generate Key
4. Copy Key ID and Key Secret
5. Update in Railway Variables:
   ```
   RAZORPAY_KEY_ID     = rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. **Webhook**: Razorpay Dashboard → Webhooks → Add
   - URL: `https://banyanvision-prod.up.railway.app/api/orders/webhook`
   - Events: `payment.captured`, `payment.failed`

---

## PART 6 — Verify everything is working

Test these URLs in order:

```
1. https://banyanvision-prod.up.railway.app/api/health
   → Should return {"status":"ok"}

2. https://banyanvision-prod.up.railway.app/api/products
   → Should return product list JSON

3. https://www.yourdomain.com
   → Should show BanyanVision homepage

4. https://www.yourdomain.com → Login as admin
   → admin@banyanvision.com / admin123

5. Place a test order with Razorpay test card:
   Card: 4111 1111 1111 1111
   Expiry: any future date
   CVV: any 3 digits
```

---

## PART 7 — Your daily workflow

```
Daily work:
  1. Edit code in VS Code
  2. Test on localhost (main branch)
  3. Run commit.bat → saves to GitHub main branch

Ready to go live:
  4. Run deploy-to-prod.bat → merges main into prod
  5. Railway auto-deploys backend in ~1 min
  6. Vercel auto-deploys frontend in ~2 mins
  7. Live at www.yourdomain.com!
```

---

## Quick reference — all your URLs

| Service      | URL                                              |
|--------------|--------------------------------------------------|
| Frontend     | https://www.yourdomain.com                       |
| Backend API  | https://banyanvision-prod.up.railway.app/api     |
| Health check | https://banyanvision-prod.up.railway.app/api/health |
| MongoDB      | MongoDB Atlas dashboard                          |
| Cloudinary   | cloudinary.com/console                           |
| Razorpay     | dashboard.razorpay.com                           |
| Railway      | railway.app/dashboard                            |
| Vercel       | vercel.com/dashboard                             |
