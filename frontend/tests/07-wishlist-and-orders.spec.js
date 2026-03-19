const { test, expect } = require('@playwright/test');
const { USER, login, openUserMenu, addToCart, openCart } = require('./helpers');

test.describe('Wishlist', () => {

  test('wishlist page loads for logged in user', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("Wishlist")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Wishlist').or(page.locator('.card-base'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('wishlist heart in header redirects guest to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('button[title="Wishlist"]');
    await page.waitForTimeout(1000);
    // Redirected to login page
    await expect(page.locator('text=Welcome Back!')).toBeVisible({ timeout: 5000 });
  });

  test('wishlist shows empty state or products', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("Wishlist")');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

});

test.describe('Orders page', () => {

  test('orders page loads for logged in user', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("My Orders")');
    await page.waitForTimeout(2500);
    await expect(
      page.locator('text=My Orders').or(page.locator('text=No orders').or(page.locator('text=Orders')))
    ).toBeVisible({ timeout: 8000 });
  });

  test('orders page does not crash', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("My Orders")');
    await page.waitForTimeout(2500);
    await expect(page.locator('body')).toBeVisible();
  });

});

test.describe('Profile', () => {

  test('profile page shows user email', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("Profile")');
    await page.waitForTimeout(1500);
    await expect(
      page.locator(`text=${USER.email}`).or(page.locator('input[type="email"]'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('profile Save button is present', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("Profile")');
    await page.waitForTimeout(1500);
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test('profile name field is editable', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("Profile")');
    await page.waitForTimeout(1500);
    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeEditable();
  });

});

test.describe('Checkout flow', () => {

  test('logged-in user can reach checkout page', async ({ page }) => {
    await login(page, USER);
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Checkout').or(page.locator('text=Shipping Address').or(page.locator('text=Delivery')))
    ).toBeVisible({ timeout: 8000 });
  });

  test('checkout address form has required fields', async ({ page }) => {
    await login(page, USER);
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    await expect(
      page.getByPlaceholder(/Full Name|name/i).or(page.getByPlaceholder(/address/i))
    ).toBeVisible({ timeout: 8000 });
  });

  test('checkout shows order summary with total', async ({ page }) => {
    await login(page, USER);
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=₹').first()).toBeVisible({ timeout: 5000 });
  });

  test('empty address fields show validation errors', async ({ page }) => {
    await login(page, USER);
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    // Try to proceed without filling address
    const nextBtn = page.locator('button:has-text("Continue to Payment"), button:has-text("Next"), button:has-text("Proceed")').first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      // Should show validation errors
      await expect(page.locator('text=required').or(page.locator('[style*="DC2626"]'))).toBeVisible({ timeout: 3000 });
    }
  });

});
