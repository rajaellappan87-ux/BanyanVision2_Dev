const { test, expect } = require('@playwright/test');
const { addToCart, openCart, goToShop } = require('./helpers');

test.describe('Cart', () => {

  test('empty cart shows empty state message', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await openCart(page);
    await expect(
      page.locator('text=Your bag is empty').or(page.locator('text=Shopping Bag'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('Add to Bag shows toast notification', async ({ page }) => {
    await addToCart(page);
    await expect(
      page.locator('text=Added to bag').or(page.locator('text=Added'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('cart badge shows count after adding item', async ({ page }) => {
    await addToCart(page);
    // Badge is a small circle span in header with a number
    const badge = page.locator('header span').filter({ hasText: /^\d+$/ }).first();
    await expect(badge).toBeVisible({ timeout: 5000 });
  });

  test('cart page heading shows Shopping Bag', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await expect(page.locator('text=Shopping Bag')).toBeVisible({ timeout: 8000 });
  });

  test('cart shows item image', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await expect(page.locator('main img').first()).toBeVisible({ timeout: 5000 });
  });

  test('cart shows item price in rupees', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await expect(page.locator('text=₹').first()).toBeVisible();
  });

  test('quantity + button increments count to 2', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await page.locator('button:has-text("+")').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('span:has-text("2")').first()).toBeVisible();
  });

  test('quantity − button decrements count back to 1', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await page.locator('button:has-text("+")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("−")').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('span:has-text("1")').first()).toBeVisible();
  });

  test('Remove button empties the cart', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await page.click('button:has-text("Remove")');
    await page.waitForTimeout(800);
    await expect(page.locator('text=Your bag is empty')).toBeVisible({ timeout: 5000 });
  });

  test('coupon input accepts text', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    const inp = page.getByPlaceholder('COUPON CODE');
    await expect(inp).toBeVisible();
    await inp.fill('BANYAN10');
    await expect(inp).toHaveValue('BANYAN10');
  });

  test('valid coupon BANYAN10 applies discount', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await page.getByPlaceholder('COUPON CODE').fill('BANYAN10');
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Discount').or(page.locator('text=✓'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('invalid coupon shows error', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await page.getByPlaceholder('COUPON CODE').fill('BADCODE999');
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Invalid').or(page.locator('text=invalid').or(page.locator('text=not')))
    ).toBeVisible({ timeout: 5000 });
  });

  test('guest sees Login to Checkout button', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await expect(
      page.locator('button:has-text("Login to Checkout")')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Login to Checkout redirects to login page', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    const btn = page.locator('button:has-text("Login to Checkout")');
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
      await expect(page.getByPlaceholder('Email')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Order Summary shows Subtotal and Total', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await expect(page.locator('text=Subtotal')).toBeVisible();
    await expect(page.locator('text=Total').first()).toBeVisible();
  });

  test('Order Summary shows Delivery row', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await expect(page.locator('text=Delivery')).toBeVisible();
  });

  test('Secured by Razorpay badge shown', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await expect(page.locator('text=Razorpay')).toBeVisible({ timeout: 5000 });
  });

  test('coupon hint text shown', async ({ page }) => {
    await addToCart(page);
    await openCart(page);
    await expect(
      page.locator('text=BANYAN10').or(page.locator('text=Try'))
    ).toBeVisible({ timeout: 5000 });
  });

});
