const { test, expect } = require('@playwright/test');

// Footer links are <div> and <span> with onClick — not <a> tags
async function clickFooterLink(page, text) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Use footer span (bottom bar links)
  await page.locator(`footer span:has-text("${text}")`).click();
  await page.waitForTimeout(800);
}

test.describe('Pages & Navigation', () => {

  test('About page loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("About")');
    await page.waitForTimeout(800);
    await expect(
      page.locator('text=Our Story').or(page.locator('text=Heritage').or(page.locator('text=artisan')))
    ).toBeVisible();
  });

  test('Privacy Policy page loads', async ({ page }) => {
    await clickFooterLink(page, 'Privacy Policy');
    await expect(page.locator('text=Privacy Policy').first()).toBeVisible();
  });

  test('Terms page loads', async ({ page }) => {
    await clickFooterLink(page, 'Terms');
    await expect(page.locator('text=Terms').first()).toBeVisible();
  });

  test('Refund Policy page loads', async ({ page }) => {
    await clickFooterLink(page, 'Refund Policy');
    await expect(page.locator('text=Refund').first()).toBeVisible();
  });

  test('Shipping page loads', async ({ page }) => {
    await clickFooterLink(page, 'Shipping');
    await expect(page.locator('text=Shipping').first()).toBeVisible();
  });

  test('legal pages have Back to Home button', async ({ page }) => {
    await clickFooterLink(page, 'Privacy Policy');
    await expect(page.locator('button:has-text("Back to Home")')).toBeVisible();
  });

  test('Back to Home button returns to homepage', async ({ page }) => {
    await clickFooterLink(page, 'Privacy Policy');
    await page.click('button:has-text("Back to Home")');
    await page.waitForTimeout(800);
    await expect(page.locator('text=BanyanVision').first()).toBeVisible();
  });

  test('footer copyright text present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // footer is in DOM — check without scrolling
    const footer = page.locator('footer');
    await expect(footer).toBeAttached();
    const text = await footer.textContent();
    expect(text).toContain('© 2025 BanyanVision');
  });

  test('footer has WhatsApp Us link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('footer a:has-text("WhatsApp Us")')).toBeAttached();
  });

  test('footer has email link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('footer a[href^="mailto:"]')).toBeAttached();
  });

  test('footer has phone link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('footer a[href^="tel:"]')).toBeAttached();
  });

});

test.describe('SEO & Meta', () => {

  test('page title is BanyanVision', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/BanyanVision/i);
  });

  test('OG title meta tag present', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[property="og:title"]', el => el.content).catch(() => '');
    expect(content).toContain('BanyanVision');
  });

  test('OG image meta tag present', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => '');
    expect(content.length).toBeGreaterThan(0);
  });

  test('meta description present', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
    expect(content.length).toBeGreaterThan(10);
  });

  test('product images are lazy loaded', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Collections")');
    await page.waitForSelector('.card-base img', { timeout: 15000 });
    const loading = await page.locator('.card-base img').first().getAttribute('loading');
    expect(loading).toBe('lazy');
  });

  test('WhatsApp floating button has correct href', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[title="Chat with us on WhatsApp"]')).toBeVisible({ timeout: 8000 });
    const href = await page.locator('a[title="Chat with us on WhatsApp"]').getAttribute('href');
    expect(href).toContain('wa.me');
  });

});

test.describe('Mobile responsiveness', () => {

  test('mobile menu button visible on 375px screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Hamburger button exists (has 3 spans inside)
    const menuBtn = page.locator('header button').filter({ has: page.locator('span') }).first();
    await expect(menuBtn).toBeVisible();
  });

  test('mobile menu opens showing nav items', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const menuBtn = page.locator('header button').filter({ has: page.locator('span') }).first();
    await menuBtn.click();
    await page.waitForTimeout(500);
    await expect(
      page.locator('button:has-text("Home")').or(page.locator('button:has-text("Collections")'))
    ).toBeVisible();
  });

  test('product cards render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Collections")');
    await page.waitForSelector('.card-base', { timeout: 15000 });
    await expect(page.locator('.card-base').first()).toBeVisible();
  });

});
