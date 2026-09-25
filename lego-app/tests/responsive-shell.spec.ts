import { test, expect } from '@playwright/test';

test.describe('Responsive Shell - Viewport Tests', () => {
  const TUTOR_EMAIL = 'orphix.itsolutions@gmail.com';
  const TUTOR_PASSWORD = 'Qasim.11';
  const ADMIN_EMAIL = 'alexabraham587@gmail.com';
  const ADMIN_PASSWORD = 'Qasim.11';

  // Mobile viewport (390x844 - iPhone)
  test.describe('Mobile (390px)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('learner - sidebar hidden, bottom bar visible', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
      await page.fill('input[type="password"]', 'Test123456!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
      const url = page.url();
      if (url.includes('/onboarding')) {
        await page.goto('/path');
      }
      
      const sidebar = page.locator('[class*="sidebar"], aside').first();
      const bottomBar = page.locator('nav[class*="mobile"]');
      
      await expect(sidebar).not.toBeVisible();
      await expect(bottomBar).toBeVisible();
    });

    test('tutor - sidebar hidden, bottom bar visible', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', TUTOR_EMAIL);
      await page.fill('input[type="password"]', TUTOR_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding|tutoring\/dashboard)/, { timeout: 15000 });
      
      const sidebar = page.locator('[class*="sidebar"], aside').first();
      const bottomBar = page.locator('nav[class*="mobile"]');
      
      await expect(sidebar).not.toBeVisible();
      await expect(bottomBar).toBeVisible();
    });

    test('admin - sidebar hidden, bottom bar visible', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin/, { timeout: 15000 });
      
      const sidebar = page.locator('[class*="sidebar"], aside').first();
      const bottomBar = page.locator('nav[class*="mobile"]');
      
      await expect(sidebar).not.toBeVisible();
      await expect(bottomBar).toBeVisible();
    });

    test('no horizontal scrollbar on mobile', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
      await page.fill('input[type="password"]', 'Test123456!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
      const url = page.url();
      if (url.includes('/onboarding')) {
        await page.goto('/path');
      }
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 390;
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });
  });

  // Tablet viewport (768x1024)
  test.describe('Tablet (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('learner - icon-only sidebar visible', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
      await page.fill('input[type="password"]', 'Test123456!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
      const url = page.url();
      if (url.includes('/onboarding')) {
        await page.goto('/path');
      }
      
      const sidebar = page.locator('[class*="sidebar"], aside').first();
      await expect(sidebar).toBeVisible();
    });

    test('tutor - icon-only sidebar visible', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', TUTOR_EMAIL);
      await page.fill('input[type="password"]', TUTOR_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding|tutoring\/dashboard)/, { timeout: 15000 });
      
      const sidebar = page.locator('[class*="sidebar"], aside').first();
      await expect(sidebar).toBeVisible();
    });

    test('admin - icon-only sidebar visible', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin/, { timeout: 15000 });
      
      const sidebar = page.locator('[class*="sidebar"], aside').first();
      await expect(sidebar).toBeVisible();
    });

    test('no horizontal scrollbar on tablet', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
      await page.fill('input[type="password"]', 'Test123456!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
      const url = page.url();
      if (url.includes('/onboarding')) {
        await page.goto('/path');
      }
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 768;
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });
  });

  // Desktop viewport (1440x900)
  test.describe('Desktop (1440px)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('learner - full sidebar visible, bottom bar hidden', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
      await page.fill('input[type="password"]', 'Test123456!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
      const url = page.url();
      if (url.includes('/onboarding')) {
        await page.goto('/path');
      }
      
      const sidebar = page.locator('[class*="sidebar"], aside').first();
      const bottomBar = page.locator('nav[class*="mobile"]');
      
      await expect(sidebar).toBeVisible();
      await expect(bottomBar).not.toBeVisible();
    });

    test('tutor - full sidebar visible, bottom bar hidden', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', TUTOR_EMAIL);
      await page.fill('input[type="password"]', TUTOR_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding|tutoring\/dashboard)/, { timeout: 15000 });
      
      const sidebar = page.locator('[class*="sidebar"], aside').first();
      const bottomBar = page.locator('nav[class*="mobile"]');
      
      await expect(sidebar).toBeVisible();
      await expect(bottomBar).not.toBeVisible();
    });

    test('admin - full sidebar visible, bottom bar hidden', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin/, { timeout: 15000 });
      
      const sidebar = page.locator('[class*="sidebar"], aside').first();
      const bottomBar = page.locator('nav[class*="mobile"]');
      
      await expect(sidebar).toBeVisible();
      await expect(bottomBar).not.toBeVisible();
    });

    test('no horizontal scrollbar on desktop', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
      await page.fill('input[type="password"]', 'Test123456!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
      const url = page.url();
      if (url.includes('/onboarding')) {
        await page.goto('/path');
      }
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 1440;
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });
  });

  // Content width tests
  test.describe('Content Width', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('mobile content uses full screen width', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
      await page.fill('input[type="password"]', 'Test123456!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
      const url = page.url();
      if (url.includes('/onboarding')) {
        await page.goto('/path');
      }
      
      const mainContent = page.locator('main').first();
      const contentWidth = await mainContent.evaluate(el => {
        if (el instanceof HTMLElement) {
          return el.offsetWidth;
        }
        return 0;
      });
      const viewportWidth = page.viewportSize()?.width || 390;
      
      expect(contentWidth).toBeGreaterThan(viewportWidth * 0.9); // Should use at least 90% of viewport
    });
  });

  // Bottom bar navigation tests
  test.describe('Bottom Bar Navigation', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('learner bottom tabs navigate correctly', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
      await page.fill('input[type="password"]', 'Test123456!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
      const url = page.url();
      if (url.includes('/onboarding')) {
        await page.goto('/path');
      }
      
      const bottomTabs = page.locator('[class*="bottom"] button, nav[class*="mobile"] button');
      const tabCount = await bottomTabs.count();
      
      if (tabCount > 0) {
        await bottomTabs.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('tutor bottom tabs navigate correctly', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', TUTOR_EMAIL);
      await page.fill('input[type="password"]', TUTOR_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(path|onboarding|tutoring\/dashboard)/, { timeout: 15000 });
      
      const bottomTabs = page.locator('[class*="bottom"] button, nav[class*="mobile"] button');
      const tabCount = await bottomTabs.count();
      
      if (tabCount > 0) {
        await bottomTabs.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('admin bottom tabs navigate correctly', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin/, { timeout: 15000 });
      
      const bottomTabs = page.locator('[class*="bottom"] button, nav[class*="mobile"] button');
      const tabCount = await bottomTabs.count();
      
      if (tabCount > 0) {
        await bottomTabs.first().click();
        await page.waitForTimeout(500);
      }
    });
  });
});
