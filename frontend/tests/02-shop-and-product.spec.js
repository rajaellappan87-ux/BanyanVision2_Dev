const { test, expect } = require('@playwright/test');

// ── Helpers ───────────────────────────────────────────────────────────────────
async function goToShop(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("Collections")');
  // Wait for product cards to load from API
  await page.waitForSelector('.card-base', { timeout: 15000 });
  await page.waitForTimeout(500);
}

async function openFirstProduct(page) {
  await goToShop(page);
  // Click the product image area (not the Add to Bag button)
  const firstCard = page.locator('.card-base').first();
  // Click the info section at the bottom of the card (always clickable)
  await firstCard.locator('div').last().click();
  // Wait for spinner to go and product data to load
  await page.waitForTimeout(500);
  // ProductDetailPage shows Spinner while loading, then h1 with product name
  await page.waitForSelector('h1', { timeout: 15000 });
  await page.waitForTimeout(500);
}

// ── Shop page tests ────────────────────────────────────────────────────────────
test.describe('Shop page', () => {

  test('product cards load from API', async ({ page }) => {
    await goToShop(page);
    const count = await page.locator('.card-base').count();
    expect(count).toBeGreaterThan(0);
  });

  test('product cards show rupee price', async ({ page }) => {
    await goToShop(page);
    await expect(page.locator('text=₹').first()).toBeVisible();
  });

  test('product images use objectFit contain', async ({ page }) => {
    await goToShop(page);
    const img = page.locator('.card-base img').first();
    await expect(img).toBeVisible();
    const fit = await img.evaluate(el => getComputedStyle(el).objectFit);
    expect(fit).toBe('contain');
  });

  test('search filters products', async ({ page }) => {
    await goToShop(page);
    const before = await page.locator('.card-base').count();
    await page.fill('input[placeholder*="Search"]', 'Saree');
    await page.waitForTimeout(800);
    const after = await page.locator('.card-base').count();
    expect(after).toBeLessThanOrEqual(before);
  });

  test('search with no match shows zero cards', async ({ page }) => {
    await goToShop(page);
    await page.fill('input[placeholder*="Search"]', 'xyznotexist999');
    await page.waitForTimeout(800);
    const count = await page.locator('.card-base').count();
    expect(count).toBe(0);
  });

  test('Add to Bag button appears on hover', async ({ page }) => {
    await goToShop(page);
    const card = page.locator('.card-base').first();
    await card.hover();
    await page.waitForTimeout(400);
    // The btn-rose Add to Bag button is inside the card overlay
    await expect(card.locator('button.btn-rose:has-text("Add to Bag")')).toBeVisible({ timeout: 3000 });
  });

  test('wishlist heart button is in header (desktop)', async ({ page }) => {
    await goToShop(page);
    // Wishlist heart is in the Header, not on each card
    // It has title="Wishlist"
    await expect(page.locator('button[title="Wishlist"]')).toBeVisible();
  });

  test('clicking category nav goes to shop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Collections")');
    await page.waitForTimeout(1000);
    await expect(page.locator('.card-base').first()).toBeVisible({ timeout: 10000 });
  });

});

// ── Product Detail page tests ─────────────────────────────────────────────────
test.describe('Product detail page', () => {

  test('clicking product card opens detail page with h1 title', async ({ page }) => {
    await openFirstProduct(page);
    // h1 is the product name
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('product gallery image is visible', async ({ page }) => {
    await openFirstProduct(page);
    // Gallery renders inside a div with aspect-ratio 9/11
    const galleryImg = page.locator('img').first();
    await expect(galleryImg).toBeVisible({ timeout: 10000 });
  });

  test('gallery main image uses objectFit contain', async ({ page }) => {
    await openFirstProduct(page);
    const img = page.locator('img').first();
    await expect(img).toBeVisible({ timeout: 10000 });
    const fit = await img.evaluate(el => getComputedStyle(el).objectFit);
    expect(fit).toBe('contain');
  });

  test('Add to Bag button is visible on detail page', async ({ page }) => {
    await openFirstProduct(page);
    // On detail page Add to Bag is always visible (not hover-only)
    await expect(page.locator('button.btn-rose:has-text("Add to Bag")')).toBeVisible({ timeout: 10000 });
  });

  test('product price shown in rupees', async ({ page }) => {
    await openFirstProduct(page);
    await expect(page.locator('text=₹').first()).toBeVisible();
  });

  test('size selector visible when sizes available', async ({ page }) => {
    await openFirstProduct(page);
    // Size buttons or Free Size text
    await expect(
      page.locator('button').filter({ hasText: /^(XS|S|M|L|XL|XXL|Free Size|One Size)$/ }).first()
        .or(page.locator('text=Free Size'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('breadcrumb shows Home and Shop', async ({ page }) => {
    await openFirstProduct(page);
    await expect(page.locator('text=Home').first()).toBeVisible();
    await expect(page.locator('text=Shop').first()).toBeVisible();
  });

  test('reviews section is present', async ({ page }) => {
    await openFirstProduct(page);
    await expect(
      page.locator('text=Reviews').or(page.locator('text=review').or(page.locator('text=Rating')))
    ).toBeVisible({ timeout: 8000 });
  });

  test('back navigation returns to shop', async ({ page }) => {
    await openFirstProduct(page);
    await page.click('text=Shop');
    await page.waitForTimeout(800);
    await expect(page.locator('.card-base').first()).toBeVisible({ timeout: 10000 });
  });

});
