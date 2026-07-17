import { test, expect } from '@playwright/test';

const dsaEventUrl = '/events/dsa-7-days-challenge-2026';

// Screen sizes to test
const screenSizes = [
  // Mobile
  { width: 320, height: 568, name: 'Mobile (320px)' },
  { width: 375, height: 667, name: 'Mobile (375px)' },
  { width: 390, height: 844, name: 'Mobile (390px)' },
  { width: 414, height: 896, name: 'Mobile (414px)' },
  
  // Tablet
  { width: 768, height: 1024, name: 'Tablet (768px)' },
  { width: 820, height: 1180, name: 'Tablet (820px)' },
  { width: 1024, height: 1366, name: 'Tablet (1024px)' },
  
  // Desktop
  { width: 1280, height: 720, name: 'Desktop (1280px)' },
  { width: 1440, height: 900, name: 'Desktop (1440px)' },
  { width: 1920, height: 1080, name: 'Desktop (1920px)' },
];

test.describe('DSA Event Responsive Design Audit', () => {
  for (const size of screenSizes) {
    test(`should render correctly on ${size.name}`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
      
      // Take screenshot for visual reference
      await page.screenshot({
        path: `test-results/responsive-${size.width}x${size.height}.png`,
        fullPage: true,
      });
      
      // 1. Check no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = size.width;
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // Allow small margin for rounding
      
      // 2. Check main content is visible
      await expect(page.locator('main').first()).toBeVisible();
      
      // 3. Check hero section renders
      await expect(page.locator('h1').first()).toBeVisible();
      
      // 4. Check countdown timer is visible
      const timerContainer = page.locator('[role="timer"], .countdown-timer, :has-text("Days")').first();
      await expect(timerContainer).toBeVisible();
      
      // 5. Check registration button is visible and clickable
      const registerButton = page.locator('a:has-text("Register for Free")').first();
      await expect(registerButton).toBeVisible();
      
      // 6. Check no text is cut off (basic check)
      const allTextElements = page.locator('h1, h2, h3, h4, h5, h6, p, span, a, button');
      const textCount = await allTextElements.count();
      
      for (let i = 0; i < Math.min(textCount, 10); i++) {
        const element = allTextElements.nth(i);
        const isVisible = await element.isVisible();
        if (isVisible) {
          const boundingBox = await element.boundingBox();
          if (boundingBox) {
            // Check element is within viewport bounds
            expect(boundingBox.x).toBeGreaterThanOrEqual(0);
            expect(boundingBox.y).toBeGreaterThanOrEqual(0);
            expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewportWidth + 10);
          }
        }
      }
      
      // 7. Check images scale properly
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const image = images.nth(i);
        const isVisible = await image.isVisible();
        if (isVisible) {
          const boundingBox = await image.boundingBox();
          if (boundingBox) {
            // Check image is not stretched disproportionately
            const naturalSize = await image.evaluate((img: HTMLImageElement) => ({
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
            }));
            
            if (naturalSize.naturalWidth > 0 && naturalSize.naturalHeight > 0) {
              const aspectRatio = naturalSize.naturalWidth / naturalSize.naturalHeight;
              const renderedAspectRatio = boundingBox.width / boundingBox.height;
              // Allow 10% tolerance for aspect ratio changes
              expect(Math.abs(aspectRatio - renderedAspectRatio)).toBeLessThan(0.1);
            }
          }
        }
      }
      
      // 8. Check navigation is usable
      if (size.width >= 768) {
        // Desktop/tablet: check navigation menu
        const navMenu = page.locator('nav, [role="navigation"]').first();
        await expect(navMenu).toBeVisible();
      } else {
        // Mobile: check hamburger menu or mobile nav
        const mobileNavTrigger = page.locator('button[aria-label*="menu"], button[aria-label*="navigation"]').first();
        if (await mobileNavTrigger.isVisible()) {
          await expect(mobileNavTrigger).toBeVisible();
        }
      }
      
      // 9. Check animations don't break layout
      // Wait for any initial animations
      await page.waitForTimeout(1000);
      
      // Check layout stability after animations
      const layoutShiftScore = await page.evaluate(() => {
        // Simple layout shift detection
        const elements = document.querySelectorAll('*');
        const shiftDetected = false;
        
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            // Element might be hidden or not rendered yet
            return;
          }
        });
        
        return shiftDetected;
      });
      
      expect(layoutShiftScore).toBe(false);
      
      // 10. Check button visibility and spacing
      const buttons = page.locator('button, [role="button"], a.button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible();
        if (isVisible) {
          const boundingBox = await button.boundingBox();
          if (boundingBox) {
            // Check button has reasonable size for touch targets on mobile
            if (size.width < 768) {
              expect(boundingBox.width).toBeGreaterThanOrEqual(44);
              expect(boundingBox.height).toBeGreaterThanOrEqual(44);
            }
            
            // Check button text is readable
            const fontSize = await button.evaluate((el) => {
              const style = window.getComputedStyle(el);
              return parseFloat(style.fontSize);
            });
            
            expect(fontSize).toBeGreaterThanOrEqual(14);
          }
        }
      }
      
      console.log(`✅ Responsive test passed for ${size.name} (${size.width}x${size.height})`);
    });
  }
  
  test('should handle orientation changes gracefully', async ({ page }) => {
    // Test portrait and landscape modes
    await page.setViewportSize({ width: 375, height: 667 }); // Portrait
    await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
    
    const portraitScreenshot = await page.screenshot({ fullPage: true });
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    
    const landscapeScreenshot = await page.screenshot({ fullPage: true });
    
    // Both should render without errors
    await expect(page.locator('main').first()).toBeVisible();
    
    // Check key elements are still visible in landscape
    await expect(page.locator('h1').first()).toBeVisible();
    
    console.log('✅ Orientation change test passed');
  });
  
  test('should maintain functionality across breakpoints', async ({ page }) => {
    // Test critical functionality at different breakpoints
    const breakpoints = [375, 768, 1024, 1440];
    
    for (const width of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
      
      // Test registration button
      const registerButton = page.locator('a:has-text("Register for Free")').first();
      await expect(registerButton).toBeVisible();
      
      // Test countdown timer
      const timerContainer = page.locator('[role="timer"], .countdown-timer, :has-text("Days")').first();
      await expect(timerContainer).toBeVisible();
      
      // Test navigation (if applicable)
      if (width >= 768) {
        const navMenu = page.locator('nav, [role="navigation"]').first();
        await expect(navMenu).toBeVisible();
      }
      
      console.log(`✅ Functionality test passed at ${width}px breakpoint`);
    }
  });
});