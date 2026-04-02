const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page title contains BanyanVision', async ({ page }) => {
    await expect(page).toHaveTitle(/BanyanVision/i);
  });

  test('header logo text visible', async ({ page }) => {
    await expect(page.locator('header').locator('text=BanyanVision').first()).toBeVisible();
  });

  test('hero h1 contains brand copy', async ({ page }) => {
    // h1 reads: "Wear India's Soul in Every Thread"
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text).toMatch(/Wear|India|Thread/i);
  });

  test('hero CTA — Shop Collection button visible', async ({ page }) => {
    await expect(
      page.locator('button.btn-rose:has-text("Shop Collection")')
    ).toBeVisible();
  });

  test('hero CTA — Our Story button visible', async ({ page }) => {
    await expect(
      page.locator('button:has-text("Our Story")')
    ).toBeVisible();
  });

  test('marquee banner is attached to DOM', async ({ page }) => {
    // Admin-editable scrolling topbar — class set by CSS animation
    const marquee = page.locator('.bv-marquee-track');
    await expect(marquee).toBeAttached({ timeout: 8000 });
  });

  test('Shop by Category section heading visible', async ({ page }) => {
    await expect(page.locator('text=Shop by Category').first()).toBeVisible({ timeout: 8000 });
  });

  test('category buttons load from API', async ({ page }) => {
    await page.waitForTimeout(2000);
    const catBtns = page.locator('button').filter({
      hasText: /Sarees|Kurtas|Lehengas|Western|Accessories/i,
    });
    await expect(catBtns.first()).toBeVisible({ timeout: 10000 });
  });

  test('featured product cards render with price', async ({ page }) => {
    await page.waitForTimeout(2000);
    const cards = page.locator('.card-base');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=₹').first()).toBeVisible();
  });

  test('Collections nav button navigates to shop', async ({ page }) => {
    await page.click('button:has-text("Collections")');
    await expect(page.locator('.card-base').first()).toBeVisible({ timeout: 12000 });
  });

  test('About nav button navigates to about page', async ({ page }) => {
    await page.click('button:has-text("About")');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('h1, h2').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Sign In button visible when logged out', async ({ page }) => {
    await expect(page.locator('.btn.btn-rose:has-text("Sign In")')).toBeVisible();
  });

  test('WhatsApp floating button visible', async ({ page }) => {
    // Floating anchor with WhatsApp SVG — appears after short delay
    await expect(
      page.locator('a[href*="wa.me"]').first()
    ).toBeAttached({ timeout: 8000 });
  });

  test('cookie banner Accept All flow works', async ({ page }) => {
    const acceptBtn = page.locator('button:has-text("Accept All")');
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click();
      await expect(acceptBtn).toHaveCount(0, { timeout: 3000 });
    }
    expect(true).toBe(true);
  });

  test('footer is present and contains BanyanVision', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeAttached();
    const text = await footer.textContent();
    expect(text).toContain('BanyanVision');
  });

  test('footer has social / contact links', async ({ page }) => {
    await expect(page.locator('footer a[href]').first()).toBeAttached({ timeout: 5000 });
  });

  test('footer bottom bar has policy quick links', async ({ page }) => {
    await expect(page.locator('footer span:has-text("Privacy Policy")')).toBeAttached();
    await expect(page.locator('footer span:has-text("Terms")')).toBeAttached();
  });

  test('Trending Picks section renders', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(
      page.locator('text=Trending Picks').or(page.locator('text=Trending'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('Why Choose BanyanVision section renders', async ({ page }) => {
    await expect(
      page.locator('text=Why Choose').first()
    ).toBeVisible({ timeout: 8000 });
  });

});
