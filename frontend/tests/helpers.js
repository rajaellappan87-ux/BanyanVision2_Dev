const { expect } = require('@playwright/test');

const ADMIN = { email: 'admin@banyanvision.com', password: 'admin123' };
const USER  = { email: 'user@test.com',          password: 'user123'  };

// Navigate to login page by clicking the header Sign In button
async function goToLogin(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.click('.btn.btn-rose:has-text("Sign In")');
  await expect(page.getByPlaceholder('Email')).toBeVisible({ timeout: 8000 });
}

// Login with credentials
async function login(page, { email, password }) {
  await goToLogin(page);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.click('button:has-text("Sign In →")');
  // Wait until Sign In button disappears (user logged in)
  await expect(
    page.locator('.btn.btn-rose:has-text("Sign In")')
  ).toHaveCount(0, { timeout: 10000 });
}

// Open user dropdown — circular gradient avatar button in header
async function openUserMenu(page) {
  const avatarBtn = page.locator('header button').filter({
    has: page.locator('div[style*="border-radius: 50%"], div[style*="border-radius:50%"], div[style*="background: linear-gradient"], div[style*="background:linear-gradient"]')
  }).first();
  await avatarBtn.click();
  await page.waitForTimeout(400);
}

// Navigate to admin panel and wait for dashboard
async function openAdmin(page) {
  await login(page, ADMIN);
  await page.click('button:has-text("Admin")');
  await expect(page.locator('text=Dashboard Overview')).toBeVisible({ timeout: 10000 });
}

// Navigate to shop and wait for product cards
async function goToShop(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("Collections")');
  await page.waitForSelector('.card-base', { timeout: 15000 });
  await page.waitForTimeout(500);
}

// Add first product to cart via hover → Add to Bag
async function addToCart(page) {
  await goToShop(page);
  const card = page.locator('.card-base').first();
  await card.hover();
  await page.waitForTimeout(500);
  await card.locator('button.btn-rose:has-text("Add to Bag")').click();
  await page.waitForTimeout(600);
}

// Open cart page by clicking the cart icon button in header
// Cart button has a badge span with position:relative styling on the button
async function openCart(page) {
  await page.locator('header button[style*="relative"]').first().click();
  await page.waitForTimeout(800);
}

module.exports = {
  ADMIN, USER,
  goToLogin, login, openUserMenu, openAdmin,
  goToShop, addToCart, openCart,
};
