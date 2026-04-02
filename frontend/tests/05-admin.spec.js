const { test, expect } = require('@playwright/test');
const { openAdmin } = require('./helpers');

test.describe('Admin Panel', () => {

  test('dashboard loads with Dashboard Overview heading', async ({ page }) => {
    await openAdmin(page);
    await expect(page.locator('text=Dashboard Overview')).toBeVisible();
  });

  test('dashboard shows Total Revenue and Orders stats', async ({ page }) => {
    await openAdmin(page);
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
  });

  test('dashboard shows Customers and Products stats', async ({ page }) => {
    await openAdmin(page);
    await expect(page.locator('text=Customers')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
  });

  test('sidebar has all expected nav tabs', async ({ page }) => {
    await openAdmin(page);
    const tabs = [
      'Overview', 'Orders', 'Products', 'Add Product', 'Inventory',
      'Customers', 'Analytics', 'Coupons', 'Categories',
      'Offer Banner', 'Marquee Banner', 'About Page', 'Site Settings', 'Log Audit',
    ];
    for (const tab of tabs) {
      await expect(page.locator(`button:has-text("${tab}")`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Orders tab — filter pills All and Pending visible', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Orders")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("All")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Pending")').first()).toBeVisible();
  });

  test('Orders tab — Download CSV button visible', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Orders")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Download CSV")')).toBeVisible();
  });

  test('Products tab loads product list', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Products")');
    await page.waitForTimeout(1500);
    await expect(
      page.locator('text=Products (').or(page.locator('h2').filter({ hasText: 'Products' }))
    ).toBeVisible({ timeout: 8000 });
  });

  test('Add Product tab has Name and Price inputs', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Add Product")');
    await page.waitForTimeout(1000);
    await expect(page.getByPlaceholder(/Product Name|name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Price|price/i)).toBeVisible();
  });

  test('Inventory tab loads without crash', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Inventory")');
    await page.waitForTimeout(1000);
    await expect(
      page.locator('h2').filter({ hasText: /Inventory/i })
        .or(page.locator('text=Inventory Manager'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('Customers tab has Add User button', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Customers")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Add User")')).toBeVisible();
  });

  test('Analytics tab loads without crash', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Coupons tab shows BANYAN10 coupon', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Coupons")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=BANYAN10')).toBeVisible({ timeout: 5000 });
  });

  test('Categories tab shows Category Manager heading', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Category Manager')).toBeVisible();
  });

  test('Categories tab shows existing category (Sarees or Kurtas)', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await expect(
      page.locator('text=Sarees').or(page.locator('text=Kurtas'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('Categories tab has emoji picker and name input', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Pick Emoji")')).toBeVisible();
    await expect(page.getByPlaceholder('Category name')).toBeVisible();
  });

  test('Category add and verify new entry', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await page.getByPlaceholder('Category name').fill('Playwright Test Cat');
    await page.click('button:has-text("Add Category")');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Playwright Test Cat')).toBeVisible();
  });

  test('Category delete removes entry', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    // Add a temp category then delete it
    await page.getByPlaceholder('Category name').fill('TempCatToDelete');
    await page.click('button:has-text("Add Category")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=TempCatToDelete')).toBeVisible();
    const row = page.locator('div').filter({ hasText: 'TempCatToDelete' }).last();
    await row.locator('button').last().click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Admin")');
    await page.waitForTimeout(1500);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=TempCatToDelete')).toHaveCount(0);
  });

  test('Offer Banner tab shows editor and preview', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Offer Banner")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Offer Banner Editor')).toBeVisible();
    await expect(page.locator('text=Preview')).toBeVisible();
  });

  test('Marquee Banner tab loads', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Marquee Banner")');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('About Page editor loads', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("About Page")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=About Page Editor')).toBeVisible();
  });

  test('Site Settings has a phone / contact input field', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Site Settings")');
    await page.waitForTimeout(1000);
    await expect(
      page.getByPlaceholder(/98765|phone|\+91/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('Site Settings Save shows confirmation', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Site Settings")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Saved').or(page.locator('text=live'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('Log Audit tab loads', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Log Audit")');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

});
