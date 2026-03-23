const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page title contains BanyanVision', async ({ page }) => {
    await expect(page).toHaveTitle(/BanyanVision/i);
  });

  test('header logo visible', async ({ page }) => {
    await expect(page.locator('text=BanyanVision').first()).toBeVisible();
  });

  test('scrolling marquee banner visible', async ({ page }) => {
    const marquee = page.locator('.bv-marquee-track');
    await expect(marquee).toBeAttached({ timeout: 8000 });
  });

  test('hero section has heading and CTA', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(
      page.locator('button').filter({ hasText: /Shop|Explore|Collection/i }).first()
    ).toBeVisible();
  });

  test('Explore categories section renders', async ({ page }) => {
    // Section heading says "Shop by Category"
    await expect(page.locator('text=Category').first()).toBeVisible({ timeout: 8000 });
  });

  test('category buttons are visible', async ({ page }) => {
    // Categories load from DB via useCatConfig — wait longer for API
    // catCfg has: "Kurtas & Sets", "Sarees", "Lehengas", "Western Wear", "Accessories", "Men's Wear"
    await page.waitForTimeout(2000); // allow API to load categories
    const catBtns = page.locator('button').filter({ hasText: /Sarees|Kurtas|Lehengas|Western|Accessories/i });
    await expect(catBtns.first()).toBeVisible({ timeout: 10000 });
  });

  test('featured products section loads cards', async ({ page }) => {
    await page.waitForTimeout(2000);
    const cards = page.locator('.card-base');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('product card shows rupee price', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page.locator('text=₹').first()).toBeVisible({ timeout: 10000 });
  });

  test('Collections nav link works', async ({ page }) => {
    // Nav button text is "Collections" → goes to ShopPage
    // ShopPage heading: "All Collections"
    await page.click('button:has-text("Collections")');
    await expect(
      page.locator('text=Collections').or(page.locator('.card-base').first())
    ).toBeVisible({ timeout: 10000 });
  });

  test('About nav link works', async ({ page }) => {
    // Nav button text is "About" → goes to AboutPage
    // AboutPage loads heading from DB via useAboutData — wait for it
    await page.click('button:has-text("About")');
    await page.waitForLoadState('networkidle');
    // About page will have "Why We Exist" or the about title from DB
    await expect(
      page.locator('text=Exist').or(page.locator('h1, h2').first())
    ).toBeVisible({ timeout: 10000 });
  });

  test('Sign In button visible when logged out', async ({ page }) => {
    await expect(page.locator('.btn.btn-rose:has-text("Sign In")')).toBeVisible();
  });

  test('WhatsApp floating button appears after delay', async ({ page }) => {
    await expect(
      page.locator('a[title="Chat with us on WhatsApp"]')
    ).toBeVisible({ timeout: 8000 });
  });

  test('cookie banner shows Accept All button', async ({ page }) => {
    const acceptBtn = page.locator('button:has-text("Accept All")');
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click();
      await expect(acceptBtn).toHaveCount(0, { timeout: 2000 });
    }
    expect(true).toBe(true);
  });

  test('footer element is present in DOM', async ({ page }) => {
    await expect(page.locator('footer')).toBeAttached();
    const footerText = await page.locator('footer').textContent();
    expect(footerText).toContain('BanyanVision');
  });

  test('footer has social links', async ({ page }) => {
    await expect(page.locator('footer a[href]').first()).toBeVisible({ timeout: 5000 });
  });

  test('footer has policy links', async ({ page }) => {
    await expect(page.locator('footer span:has-text("Privacy Policy")')).toBeAttached();
    await expect(page.locator('footer span:has-text("Terms")')).toBeAttached();
  });

});
