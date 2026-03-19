const { test, expect } = require('@playwright/test');
const { ADMIN, USER, login, goToLogin, openUserMenu } = require('./helpers');

test.describe('Authentication', () => {

  test('login page renders', async ({ page }) => {
    await goToLogin(page);
    await expect(page.locator('text=Welcome Back!')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In →")')).toBeVisible();
  });

  test('shows demo credentials', async ({ page }) => {
    await goToLogin(page);
    await expect(page.locator('text=admin@banyanvision.com')).toBeVisible();
    await expect(page.locator('text=user@test.com')).toBeVisible();
  });

  test('wrong password shows error', async ({ page }) => {
    await goToLogin(page);
    await page.getByPlaceholder('Email').fill('wrong@wrong.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.click('button:has-text("Sign In →")');
    await page.waitForTimeout(3000);
    await expect(
      page.locator('text=Invalid').or(page.locator('text=incorrect').or(page.locator('text=not found').or(page.locator('[style*="EF4444"]'))))
    ).toBeVisible({ timeout: 5000 });
  });

  test('login as customer removes Sign In button', async ({ page }) => {
    await login(page, USER);
    await expect(page.locator('.btn.btn-rose:has-text("Sign In")')).toHaveCount(0);
  });

  test('login as admin shows Admin button', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.locator('button:has-text("Admin")')).toBeVisible({ timeout: 5000 });
  });

  test('user avatar appears after login', async ({ page }) => {
    await login(page, USER);
    // Avatar shows first letter of name in a colored circle
    const avatar = page.locator('header div[style*="border-radius: 50%"]').first();
    await expect(avatar).toBeVisible();
  });

  test('user menu opens showing Profile, My Orders, Wishlist, Sign Out', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await expect(page.locator('button:has-text("Profile")')).toBeVisible();
    await expect(page.locator('button:has-text("My Orders")')).toBeVisible();
    await expect(page.locator('button:has-text("Wishlist")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });

  test('user menu shows email', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await expect(page.locator(`text=${USER.email}`)).toBeVisible();
  });

  test('logout restores Sign In button', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(1000);
    await expect(page.locator('.btn.btn-rose:has-text("Sign In")')).toBeVisible({ timeout: 5000 });
  });

  test('register tab shows Create Account form', async ({ page }) => {
    await goToLogin(page);
    await page.click('button:has-text("Register")');
    await page.waitForTimeout(300);
    await expect(page.locator('text=Create Account')).toBeVisible();
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
  });

  test('new account registration works', async ({ page }) => {
    await goToLogin(page);
    await page.click('button:has-text("Register")');
    await page.waitForTimeout(300);
    await page.getByPlaceholder('Your name').fill('New User');
    await page.getByPlaceholder('Email').fill(`newuser_${Date.now()}@test.com`);
    await page.getByPlaceholder('Password').fill('password123');
    await page.click('button:has-text("Create Account →")');
    await page.waitForTimeout(4000);
    await expect(page.locator('.btn.btn-rose:has-text("Sign In")')).toHaveCount(0, { timeout: 8000 });
  });

});
