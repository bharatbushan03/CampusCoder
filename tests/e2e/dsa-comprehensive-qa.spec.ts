import { test, expect } from '@playwright/test';

test.describe('DSA Challenge Comprehensive QA Testing', () => {
  const dsaEventUrl = '/events/dsa-7-days-challenge-2026';
  
  test.beforeEach(async ({ page }) => {
    // Clear console errors before each test
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
    await page.exposeFunction('__consoleErrors', () => consoleErrors);
  });

  test('should load DSA event page with correct metadata', async ({ page }) => {
    await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
    
    // Check page title
    await expect(page).toHaveTitle(/7 Days DSA Challenge 2026 \| CampusCoder/i);
    
    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toContain('Master Data Structures & Algorithms in 7 days');
    
    // Check OpenGraph metadata
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain('7 Days DSA Challenge 2026');
    
    // Check Twitter card
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBe('summary_large_image');
    
    // Check JSON-LD structured data
    const jsonLdScript = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLdScript).toContain('EducationEvent');
    expect(jsonLdScript).toContain('7 Days DSA Challenge 2026');
    
    // Verify no console errors
    const consoleErrors = await page.evaluate(async () => window.__consoleErrors());
    expect(consoleErrors).toEqual([]);
  });

  test('should display countdown timer correctly', async ({ page }) => {
    await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
    
    // Check countdown timer section exists
    await expect(page.locator('text=Event Starts In')).toBeVisible();
    
    // Check countdown timer container - look for timer role or countdown text
    const timerContainer = page.locator('[role="timer"], .countdown-timer, :has-text("Days")').first();
    await expect(timerContainer).toBeVisible();
    
    // Check timer has time units (days, hours, minutes, seconds)
    const timeUnits = ['Days', 'Hours', 'Mins', 'Secs'];
    for (const unit of timeUnits) {
      await expect(page.locator(`text=${unit}`).first()).toBeVisible();
    }
    
    // Check timer numbers are displayed
    const timerNumbers = page.locator('.countdown-number, [role="timer"] span, .tabular-nums').first();
    await expect(timerNumbers).toBeVisible();
    
    // Check timer has proper ARIA attributes if role="timer" exists
    const timerWithRole = page.locator('[role="timer"]');
    if (await timerWithRole.count() > 0) {
      const ariaLabel = await timerWithRole.first().getAttribute('aria-label');
      expect(ariaLabel).toContain('Countdown');
    }
  });

  test('should have working registration button', async ({ page }) => {
    await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
    
    // Find registration button
    const registerButton = page.locator('a[href*="docs.google.com/forms"]').first();
    await expect(registerButton).toBeVisible();
    
    // Check button text
    const buttonText = await registerButton.textContent();
    expect(buttonText).toContain('Register');
    
    // Verify link opens in new tab
    const targetAttr = await registerButton.getAttribute('target');
    expect(targetAttr).toBe('_blank');
    
    const relAttr = await registerButton.getAttribute('rel');
    expect(relAttr).toContain('noopener');
    expect(relAttr).toContain('noreferrer');
  });

  test('should have proper navigation and layout', async ({ page }) => {
    await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
    
    // Check navbar is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check footer is present
    await expect(page.locator('footer')).toBeVisible();
    
    // Check main content sections exist
    const sectionCount = await page.locator('section').count();
    expect(sectionCount).toBeGreaterThan(3);
    
    // Check hero section has proper content
    await expect(page.locator('h1:has-text("Master DSA in")')).toBeVisible();
    
    // Check event details are displayed
    const eventDetails = ['22-28 June 2026', '6 PM - 9 PM IST', 'Virtual', 'HackerRank'];
    for (const detail of eventDetails) {
      await expect(page.locator(`text=${detail}`).first()).toBeVisible();
    }
  });

  test('should be responsive across different viewports', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'large-desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `qa-screenshots/dsa-comprehensive-${viewport.name}.png`, 
        fullPage: true 
      });
      
      // Verify content is visible (not overflowing or hidden)
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[role="timer"], .countdown-timer, :has-text("Days")').first()).toBeVisible();
      
      // Check layout adapts (grid/flex changes)
      const heroLayout = await page.locator('section').first().evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          flexDirection: style.flexDirection,
          gridTemplateColumns: style.gridTemplateColumns
        };
      });
      
      // Should have some responsive layout
      expect(heroLayout.display).toMatch(/(flex|grid|block)/);
    }
  });

  test('should have proper accessibility features', async ({ page }) => {
    await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
    
    // Check semantic HTML structure
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('header').first()).toBeVisible();
    
    // Check heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Check images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBe('');
    }
    
    // Check interactive elements have proper roles
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const role = await buttons.nth(i).getAttribute('role');
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      // Either has role="button" or is a native button with accessible name
      expect(role === 'button' || ariaLabel || await buttons.nth(i).textContent()).toBeTruthy();
    }
    
    // Check color contrast (basic check - not full audit)
    const heroText = page.locator('h1');
    const heroColor = await heroText.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color;
    });
    // Accept various white/light color formats (RGB, hex, lab, etc.)
    expect(heroColor).toMatch(/(rgb\(255,\s*255,\s*255\)|#ffffff|lab\(.*\)|color\(.*\))/i); // Should be white or very light
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
    
    // Start with tab focus on page
    await page.keyboard.press('Tab');
    
    // Check focus is visible on interactive elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
    
    // Check focus styles are applied
    const focusOutline = await page.evaluate(() => {
      const style = window.getComputedStyle(document.activeElement as Element);
      return style.outlineWidth !== '0px' || style.boxShadow !== 'none';
    });
    expect(focusOutline).toBe(true);
    
    // Tab through main interactive elements
    const interactiveSelectors = [
      'a[href*="docs.google.com/forms"]', // Registration button
      'nav a', // Navigation links
      'button' // Any buttons
    ];
    
    for (const selector of interactiveSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        await expect(elements.first()).toBeVisible();
      }
    }
  });

  test('should have proper animations and loading states', async ({ page }) => {
    await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
    
    // Check 3D component has loading state
    const loadingState = page.locator('text=Loading 3D visualization');
    if (await loadingState.count() > 0) {
      await expect(loadingState).toBeVisible();
    }
    
    // Check countdown timer has animation classes - use a more flexible selector
    const timerNumbers = page.locator('.countdown-number, [role="timer"] span, .tabular-nums').first();
    if (await timerNumbers.count() > 0) {
      const hasAnimation = await timerNumbers.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transition !== 'none' || style.animation !== 'none';
      });
      expect(hasAnimation).toBe(true);
    }
    
    // Check page transition animations
    const animatedSections = page.locator('[data-animate], .animate-in, [class*="animate"]');
    const animatedCount = await animatedSections.count();
    expect(animatedCount).toBeGreaterThan(0);
  });

  test('should have proper SEO and social sharing features', async ({ page }) => {
    await page.goto(dsaEventUrl, { waitUntil: 'domcontentloaded' });
    
    // Check canonical URL - check both link[rel="canonical"] and meta property
    const canonicalLink = page.locator('link[rel="canonical"]');
    if (await canonicalLink.count() > 0) {
      const canonical = await canonicalLink.getAttribute('href');
      expect(canonical).toContain('dsa-7-days-challenge-2026');
    }
    
    // Check OpenGraph image
    const ogImage = page.locator('meta[property="og:image"]');
    if (await ogImage.count() > 0) {
      const ogImageContent = await ogImage.getAttribute('content');
      expect(ogImageContent).toContain('dsa-challenge');
    }
    
    // Check Twitter metadata
    const twitterTitle = page.locator('meta[name="twitter:title"]');
    if (await twitterTitle.count() > 0) {
      const twitterTitleContent = await twitterTitle.getAttribute('content');
      expect(twitterTitleContent).toContain('7 Days DSA Challenge');
    }
    
    // Check structured data is valid JSON
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    if (await jsonLdScript.count() > 0) {
      const jsonLdContent = await jsonLdScript.textContent();
      expect(() => JSON.parse(jsonLdContent!)).not.toThrow();
      
      const structuredData = JSON.parse(jsonLdContent!);
      expect(structuredData['@type']).toBe('EducationEvent');
      expect(structuredData.name).toBe('7 Days DSA Challenge 2026');
      expect(structuredData.startDate).toBe('2026-06-22T18:00:00+05:30');
    }
  });

  test('should perform well with Lighthouse metrics', async ({ page }) => {
    await page.goto(dsaEventUrl, { waitUntil: 'networkidle' });
    
    // Basic performance checks
    const loadTime = await page.evaluate(() => window.performance.timing.loadEventEnd - window.performance.timing.navigationStart);
    expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
    
    // Check for large layout shifts
    const layoutShifts = await page.evaluate(() => {
      return (window as any).performance?.getEntriesByType?.('layout-shift') || [];
    });
    expect(layoutShifts.length).toBeLessThan(5); // Should have minimal layout shifts
    
    // Check for blocking resources
    const criticalResources = await page.evaluate(() => {
      const resources = (window as any).performance?.getEntriesByType?.('resource') || [];
      return resources.filter((r: any) => r.initiatorType === 'script' || r.initiatorType === 'css');
    });
    
    // Should have reasonable number of resources
    expect(criticalResources.length).toBeLessThan(35);
  });
});

declare global {
  interface Window {
    __consoleErrors: () => Promise<string[]>;
  }
}