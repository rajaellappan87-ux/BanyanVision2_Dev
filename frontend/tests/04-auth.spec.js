const { test, expect } = require('@playwright/test');
const { ADMIN, USER, login, goToLogin, openUserMenu } = require('./helpers');

test.describe('Authentication', () => {

  test('login page renders with all fields', async ({ page }) => {
    await goToLogin(page);
    await expect(page.locator('text=Welcome Back!')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In →")')).toBeVisible();
  });

  test('login page shows demo credentials', async ({ page }) => {
    await goToLogin(page);
    await expect(page.locator('text=admin@banyanvision.com')).toBeVisible();
    await expect(page.locator('text=user@test.com')).toBeVisible();
  });

  test('wrong credentials show error message', async ({ page }) => {
    await goToLogin(page);
    await page.getByPlaceholder('Email').fill('wrong@wrong.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.click('button:has-text("Sign In →")');
    await page.waitForTimeout(3000);
    await expect(
      page.locator('text=Invalid')
        .or(page.locator('text=incorrect'))
        .or(page.locator('text=not found'))
        .or(page.locator('text=wrong'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('customer login removes Sign In button', async ({ page }) => {
    await login(page, USER);
    await expect(page.locator('.btn.btn-rose:has-text("Sign In")')).toHaveCount(0);
  });

  test('admin login shows Admin nav button', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.locator('button:has-text("Admin")')).toBeVisible({ timeout: 5000 });
  });

  test('user avatar circle appears after login', async ({ page }) => {
    await login(page, USER);
    // Avatar is a circular gradient div inside a header button
    const avatar = page.locator('header').locator('div[style*="border-radius"]').first();
    await expect(avatar).toBeVisible({ timeout: 5000 });
  });

  test('user dropdown shows Profile, My Orders, Wishlist, Sign Out', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await expect(page.locator('button:has-text("Profile")')).toBeVisible();
    await expect(page.locator('button:has-text("My Orders")')).toBeVisible();
    await expect(page.locator('button:has-text("Wishlist")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });

  test('user dropdown shows logged-in email', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await expect(page.locator(`text=${USER.email}`)).toBeVisible();
  });

  test('sign out restores Sign In button', async ({ page }) => {
    await login(page, USER);
    await openUserMenu(page);
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(1000);
    await expect(page.locator('.btn.btn-rose:has-text("Sign In")')).toBeVisible({ timeout: 5000 });
  });

  test('Register tab shows Create Account form', async ({ page }) => {
    await goToLogin(page);
    await page.click('button:has-text("Register")');
    await page.waitForTimeout(300);
    await expect(page.locator('text=Create Account')).toBeVisible();
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
  });

  test('register submit button labeled Create Account', async ({ page }) => {
    await goToLogin(page);
    await page.click('button:has-text("Register")');
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
  });

  test('new user registration succeeds and logs in', async ({ page }) => {
    await goToLogin(page);
    await page.click('button:has-text("Register")');
    await page.waitForTimeout(300);
    await page.getByPlaceholder('Your name').fill('Test User');
    await page.getByPlaceholder('Email').fill(`testuser_${Date.now()}@test.com`);
    await page.getByPlaceholder('Password').fill('password123');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(4000);
    // After registration Sign In button should be gone
    await expect(
      page.locator('.btn.btn-rose:has-text("Sign In")')
    ).toHaveCount(0, { timeout: 8000 });
  });

  test('admin dropdown shows Admin Panel option', async ({ page }) => {
    await login(page, ADMIN);
    await openUserMenu(page);
    await expect(
      page.locator('button:has-text("Admin Panel"), button:has-text("Admin")')
        .first()
    ).toBeVisible({ timeout: 5000 });
  });

});
