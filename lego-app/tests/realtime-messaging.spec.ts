import { test, expect } from '@playwright/test';

test.describe('Realtime Messaging', () => {
  const TUTOR_EMAIL = 'orphix.itsolutions@gmail.com';
  const TUTOR_PASSWORD = 'Qasim.11';
  const ADMIN_EMAIL = 'alexabraham587@gmail.com';
  const ADMIN_PASSWORD = 'Qasim.11';

  test('messages page loads for both users', async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    // First user (tutor)
    await page1.goto('/sign-in');
    await page1.waitForLoadState('networkidle');
    await page1.fill('input[name="email"]', TUTOR_EMAIL);
    await page1.fill('input[name="password"]', TUTOR_PASSWORD);
    await page1.click('button[type="submit"]');
    await page1.waitForURL(/\/(tutoring\/dashboard|path|admin)/, { timeout: 15000 });
    
    await page1.goto('/messages');
    await page1.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page1.locator('h1').first()).toContainText('Messages', { timeout: 10000 });
    
    await context1.close();
    
    // Second user (admin)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    await page2.goto('/sign-in');
    await page2.waitForLoadState('networkidle');
    await page2.fill('input[name="email"]', ADMIN_EMAIL);
    await page2.fill('input[name="password"]', ADMIN_PASSWORD);
    await page2.click('button[type="submit"]');
    await page2.waitForURL(/\/admin/, { timeout: 15000 });
    
    await page2.goto('/messages');
    await page2.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page2.locator('h1').first()).toContainText('Messages', { timeout: 10000 });
    
    await context2.close();
  });

  test('realtime subscription is active on message thread', async ({ browser }) => {
    // This test verifies that the realtime subscription is set up
    // Actual realtime message testing requires two users in the same conversation
    // which requires creating test data first
    
    test.skip(true, 'Requires test conversation data - skipping for now');
  });

  test('messages table is in realtime publication', async ({ page }) => {
    // This is a database verification, not a UI test
    // Run the prove_rls.sql script to verify this
    test.skip(true, 'Run prove_rls.sql in Supabase SQL Editor to verify');
  });
});
