const { test, expect } = require('@playwright/test');

// ── Helpers ───────────────────────────────────────────────────────────────────
async function goToShop(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("Collections")');
  await page.waitForSelector('.card-base', { timeout: 15000 });
  await page.waitForTimeout(500);
}

async function openFirstProduct(page) {
  await goToShop(page);
  const firstCard = page.locator('.card-base').first();
  // Click the card info area (not the hover overlay button)
  await firstCard.click();
  await page.waitForTimeout(600);
  // ProductDetailPage shows h1 with product name after loading
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

  test('shop heading shows All Collections', async ({ page }) => {
    await goToShop(page);
    await expect(
      page.locator('h1:has-text("Collections"), h1:has-text("All")').first()
    ).toBeVisible({ timeout: 8000 });
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

  test('search box has correct placeholder', async ({ page }) => {
    await goToShop(page);
    await expect(
      page.locator('input[placeholder*="Search"]')
    ).toBeVisible();
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

  test('Add to Bag button appears on card hover', async ({ page }) => {
    await goToShop(page);
    const card = page.locator('.card-base').first();
    await card.hover();
    await page.waitForTimeout(400);
    await expect(
      card.locator('button.btn-rose:has-text("Add to Bag")')
    ).toBeVisible({ timeout: 3000 });
  });

  test('sort dropdown has expected options', async ({ page }) => {
    await goToShop(page);
    const select = page.locator('select');
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Newest');
    expect(options).toContain('Price ↑');
    expect(options).toContain('Price ↓');
  });

  test('Filter button toggles filter panel', async ({ page }) => {
    await goToShop(page);
    await page.click('button:has-text("Filter")');
    await page.waitForTimeout(400);
    // Price range slider or max price label appears
    await expect(
      page.locator('text=Max').or(page.locator('input[type="range"]'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('wishlist button visible in header', async ({ page }) => {
    await goToShop(page);
    await expect(page.locator('button[title="Wishlist"]')).toBeVisible();
  });

  test('clicking Collections nav loads shop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Collections")');
    await expect(page.locator('.card-base').first()).toBeVisible({ timeout: 12000 });
  });

});

// ── Product Detail page tests ─────────────────────────────────────────────────
test.describe('Product detail page', () => {

  test('clicking product card opens detail page with h1', async ({ page }) => {
    await openFirstProduct(page);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('product gallery image is visible', async ({ page }) => {
    await openFirstProduct(page);
    await expect(page.locator('img').first()).toBeVisible({ timeout: 10000 });
  });

  test('gallery image uses objectFit contain', async ({ page }) => {
    await openFirstProduct(page);
    const img = page.locator('img').first();
    await expect(img).toBeVisible({ timeout: 10000 });
    const fit = await img.evaluate(el => getComputedStyle(el).objectFit);
    expect(fit).toBe('contain');
  });

  test('Add to Bag button visible on detail page', async ({ page }) => {
    await openFirstProduct(page);
    await expect(
      page.locator('button.btn-rose:has-text("Add to Bag")')
    ).toBeVisible({ timeout: 10000 });
  });

  test('product price shown in rupees', async ({ page }) => {
    await openFirstProduct(page);
    await expect(page.locator('text=₹').first()).toBeVisible();
  });

  test('size selector or Free Size text visible', async ({ page }) => {
    await openFirstProduct(page);
    await expect(
      page.locator('button').filter({ hasText: /^(XS|S|M|L|XL|XXL|Free Size|One Size)$/ }).first()
        .or(page.locator('text=Free Size').first())
        .or(page.locator('text=One Size').first())
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
      page.locator('text=Reviews').or(page.locator('text=Rating')).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('clicking breadcrumb Shop returns to shop', async ({ page }) => {
    await openFirstProduct(page);
    await page.locator('text=Shop').first().click();
    await page.waitForTimeout(800);
    await expect(page.locator('.card-base').first()).toBeVisible({ timeout: 10000 });
  });

  test('add to bag on detail page shows toast', async ({ page }) => {
    await openFirstProduct(page);
    // Select a size first if buttons are present
    const sizeBtn = page.locator('button').filter({ hasText: /^(XS|S|M|L|XL|XXL|Free Size|One Size)$/ }).first();
    if (await sizeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sizeBtn.click();
    }
    await page.locator('button.btn-rose:has-text("Add to Bag")').click();
    await expect(
      page.locator('text=Added').or(page.locator('text=bag'))
    ).toBeVisible({ timeout: 5000 });
  });

});
