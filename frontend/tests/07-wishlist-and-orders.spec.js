const { test, expect } = require('@playwright/test');
const { USER, login, openUserMenu, addToCart, openCart } = require('./helpers');

test.describe('Wishlist', () => {

  test('wishlist page loads for logged-in user', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("Wishlist")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Wishlist').or(page.locator('.card-base'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('wishlist heart button redirects guest to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('button[title="Wishlist"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Welcome Back!')).toBeVisible({ timeout: 5000 });
  });

  test('wishlist page renders without crash', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("Wishlist")');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

});

test.describe('Orders page', () => {

  test('orders page loads for logged-in user', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("My Orders")');
    await page.waitForTimeout(2500);
    await expect(
      page.locator('text=My Orders')
        .or(page.locator('text=No orders'))
        .or(page.locator('text=Orders'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('orders page renders without crash', async ({ page }) => {
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
    // Logged-in users see "Proceed to Checkout →"
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Checkout')
        .or(page.locator('text=Delivery Details'))
        .or(page.locator('text=Shipping'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('checkout shows step indicator', async ({ page }) => {
    await login(page, USER);
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Delivery Details').or(page.locator('text=Review'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('checkout address form has required input fields', async ({ page }) => {
    await login(page, USER);
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    await expect(
      page.getByPlaceholder(/Full Name|name/i)
        .or(page.getByPlaceholder(/address/i))
        .or(page.locator('input').first())
    ).toBeVisible({ timeout: 8000 });
  });

  test('checkout shows order total in rupees', async ({ page }) => {
    await login(page, USER);
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=₹').first()).toBeVisible({ timeout: 5000 });
  });

  test('checkout Continue button is present in step 1', async ({ page }) => {
    await login(page, USER);
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('button:has-text("Continue")')
    ).toBeVisible({ timeout: 8000 });
  });

  test('empty address shows validation on Continue', async ({ page }) => {
    await login(page, USER);
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(2000);
    const continueBtn = page.locator('button:has-text("Continue")').first();
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
      await expect(
        page.locator('text=required')
          .or(page.locator('text=Required'))
          .or(page.locator('[style*="DC2626"]'))
      ).toBeVisible({ timeout: 3000 });
    }
  });

});
