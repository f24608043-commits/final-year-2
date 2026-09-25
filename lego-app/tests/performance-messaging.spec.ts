import { test, expect } from '@playwright/test';

test.describe('Performance Measurement - Messaging Impact', () => {
  const TUTOR_EMAIL = 'orphix.itsolutions@gmail.com';
  const TUTOR_PASSWORD = 'Qasim.11';

  test('measure /messages page load time', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TUTOR_EMAIL);
    await page.fill('input[name="password"]', TUTOR_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/(tutoring\/dashboard|path|admin)/, { timeout: 15000 });

    const startTime = Date.now();
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    console.log(`📊 /messages page load time: ${loadTime}ms`);
    
    // Page should load in less than 15 seconds
    expect(loadTime).toBeLessThan(15000);
  });

  test('measure /messages/[id] page load time', async ({ page }) => {
    test.skip(true, 'Requires actual conversation data - skipping for now');
  });

  test('measure /tutoring/test-setup page load time', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TUTOR_EMAIL);
    await page.fill('input[name="password"]', TUTOR_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/(tutoring\/dashboard|path|admin)/, { timeout: 15000 });

    const startTime = Date.now();
    await page.goto('/tutoring/test-setup');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    console.log(`📊 /tutoring/test-setup page load time: ${loadTime}ms`);
    
    // Page should load in less than 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('measure bundle size impact', async ({ page }) => {
    // This test checks the JavaScript bundle size by looking at network requests
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TUTOR_EMAIL);
    await page.fill('input[name="password"]', TUTOR_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/tutoring\/dashboard|\/path/, { timeout: 15000 });

    // Navigate to messages and capture network requests
    const jsRequests: any[] = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') || url.includes('webpack') || url.includes('next')) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          jsRequests.push({
            url,
            size: parseInt(contentLength, 10),
          });
        }
      }
    });

    await page.goto('/messages');
    await page.waitForLoadState('networkidle');

    // Calculate total JS size
    const totalSize = jsRequests.reduce((sum, req) => sum + req.size, 0);
    const totalSizeKB = (totalSize / 1024).toFixed(2);

    console.log(`📊 Total JavaScript bundle size for /messages: ${totalSizeKB} KB`);
    console.log(`📊 Number of JS requests: ${jsRequests.length}`);

    // Log individual requests
    jsRequests.forEach(req => {
      console.log(`  - ${req.url.split('/').pop()}: ${(req.size / 1024).toFixed(2)} KB`);
    });

    // Bundle size should be reasonable (< 500 KB for initial load)
    expect(totalSize).toBeLessThan(500 * 1024);
  });

  test('measure navigation shell performance', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TUTOR_EMAIL);
    await page.fill('input[name="password"]', TUTOR_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/(tutoring\/dashboard|path|admin)/, { timeout: 15000 });

    const startTime = Date.now();
    await page.goto('/library');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    console.log(`📊 /library page load time: ${loadTime}ms`);
    
    // Page should load in less than 15 seconds
    expect(loadTime).toBeLessThan(15000);
  });
});
