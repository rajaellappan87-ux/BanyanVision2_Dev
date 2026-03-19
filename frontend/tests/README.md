# BanyanVision — Playwright Test Suite

## Setup (one time)

```powershell
cd D:\Raja\Misc\BV\BanyanVision\frontend
npm install -D @playwright/test
npx playwright install chromium
```

## Run tests

```powershell
# Run all tests
npx playwright test

# Run specific file
npx playwright test tests/01-homepage.spec.js

# Run with visible browser (watch mode)
npx playwright test --headed

# Run only on mobile
npx playwright test --project="Mobile Safari"

# Open HTML report after run
npx playwright show-report
```

## Record new tests (easiest way)

```powershell
npx playwright codegen http://localhost:3000
```

This opens a browser — just click through the site and Playwright writes the test code automatically.

## Test files

| File | What it tests |
|------|--------------|
| 01-homepage.spec.js      | Hero, banner, categories, featured products |
| 02-shop-and-product.spec.js | Shop listing, filters, product detail, images |
| 03-cart.spec.js          | Add to bag, qty, remove, coupon code |
| 04-auth.spec.js          | Login, logout, register, wrong password |
| 05-admin.spec.js         | All 8 admin tabs, dashboard stats |
| 06-pages-and-seo.spec.js | About, legal pages, 404, OG tags, cookie |
| 07-wishlist-and-orders.spec.js | Wishlist, orders, profile (requires login) |

## Notes

- Both frontend (port 3000) AND backend (port 5000) must be running
- Demo credentials: admin@banyanvision.com / admin123 and user@test.com / user123
- Failed tests save screenshots and video in playwright-report/
- Re-run failed tests only: npx playwright test --last-failed
