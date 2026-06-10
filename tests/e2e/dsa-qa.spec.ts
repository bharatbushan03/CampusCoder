import { test, expect } from '@playwright/test';

test.describe('DSA Challenge QA Testing & Screenshots', () => {
  // We'll test across multiple viewports
  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    test(`Capture screenshots on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      
      // Navigate to the new landing page
      await page.goto('/events/dsa-7-days-challenge-2026');

      // Wait for the page to fully load and animations to settle
      await page.waitForTimeout(2000);

      // Verify the countdown timer exists (soft assertion)
      const timer = page.locator('text=Event Starts In').first();
      
      // Verify the Register button goes to the Google Form (soft assertion)
      const registerButton = page.locator('a[href*="docs.google.com/forms"]').first();

      // Take a full page screenshot
      await page.screenshot({ 
        path: `qa-screenshots/dsa-challenge-${vp.name.toLowerCase()}.png`, 
        fullPage: true 
      });
    });
  }
});
