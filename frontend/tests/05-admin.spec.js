const { test, expect } = require('@playwright/test');
const { openAdmin } = require('./helpers');

test.describe('Admin Panel', () => {

  test('dashboard loads with revenue and orders stats', async ({ page }) => {
    await openAdmin(page);
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
  });

  test('sidebar has all 12 nav items', async ({ page }) => {
    await openAdmin(page);
    const tabs = ['Overview','Orders','Products','Add Product','Inventory',
                  'Customers','Analytics','Coupons','Categories','Offer Banner',
                  'About Page','Site Settings'];
    for (const tab of tabs) {
      await expect(page.locator(`button:has-text("${tab}")`)).toBeVisible();
    }
  });

  test('Orders tab — filter pills visible', async ({ page }) => {
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

  test('Products tab loads', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Products")');
    await page.waitForTimeout(1500);
    await expect(
      page.locator('text=Products (').or(page.locator('h2').filter({ hasText: 'Products' }))
    ).toBeVisible();
  });

  test('Add Product tab has Name and Price fields', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Add Product")');
    await page.waitForTimeout(1000);
    await expect(page.getByPlaceholder(/Product Name|name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Price|price/i)).toBeVisible();
  });

  test('Inventory tab loads', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Inventory")');
    await page.waitForTimeout(1000);
    await expect(page.locator('h2').filter({ hasText: 'Inventory' }).or(page.locator('text=Inventory Manager'))).toBeVisible();
  });

  test('Customers tab has Add User button', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Customers")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Add User")')).toBeVisible();
  });

  test('Coupons tab shows known coupon BANYAN10', async ({ page }) => {
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

  test('Categories tab shows existing category names', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await expect(
      page.locator('text=Sarees').or(page.locator('text=Kurtas'))
    ).toBeVisible();
  });

  test('Category — emoji picker button present', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Pick Emoji")')).toBeVisible();
  });

  test('Category — new name input present', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await expect(page.getByPlaceholder('Category name')).toBeVisible();
  });

  test('Category — add and verify new category', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await page.getByPlaceholder('Category name').fill('Playwright Test Cat');
    await page.click('button:has-text("Add Category")');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Playwright Test Cat')).toBeVisible();
  });

  test('Category — deleted category does not come back on reload', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    // Add temp category
    await page.getByPlaceholder('Category name').fill('TempCatToDelete');
    await page.click('button:has-text("Add Category")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=TempCatToDelete')).toBeVisible();
    // Delete it — find trash button in the list row
    const row = page.locator('div').filter({ hasText: 'TempCatToDelete' }).last();
    await row.locator('button').last().click();
    await page.waitForTimeout(500);
    // Confirm delete modal
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(1000);
    // Reload and check it's gone
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Admin")');
    await page.waitForTimeout(1500);
    await page.click('button:has-text("Categories")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=TempCatToDelete')).toHaveCount(0);
  });

  test('Offer Banner tab shows preview', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Offer Banner")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Offer Banner Editor')).toBeVisible();
    await expect(page.locator('text=Preview')).toBeVisible();
  });

  test('About Page editor loads', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("About Page")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=About Page Editor')).toBeVisible();
  });

  test('Site Settings has phone field', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Site Settings")');
    await page.waitForTimeout(1000);
    await expect(page.getByPlaceholder(/98765|phone|\+91/i)).toBeVisible({ timeout: 5000 });
  });

  test('Site Settings Save shows confirmation', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Site Settings")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Saved').or(page.locator('text=live ✓'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('Analytics tab loads without crash', async ({ page }) => {
    await openAdmin(page);
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

});
