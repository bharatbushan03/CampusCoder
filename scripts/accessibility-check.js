const { chromium } = require('playwright');

async function checkAccessibility() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/events/dsa-7-days-challenge-2026', { waitUntil: 'domcontentloaded' });
  
  console.log('=== Accessibility Audit ===\n');
  
  // 1. Check heading hierarchy
  const h1Count = await page.locator('h1').count();
  console.log(`✓ Found ${h1Count} H1 heading(s)`);
  
  const h2Count = await page.locator('h2').count();
  console.log(`✓ Found ${h2Count} H2 heading(s)`);
  
  // 2. Check images have alt text
  const images = await page.locator('img').all();
  console.log(`\n=== Image Alt Text Check (${images.length} images) ===`);
  
  for (let i = 0; i < Math.min(images.length, 10); i++) {
    const alt = await images[i].getAttribute('alt');
    if (!alt || alt.trim() === '') {
      console.log(`✗ Image ${i + 1}: Missing alt text`);
    } else {
      console.log(`✓ Image ${i + 1}: Has alt text "${alt.substring(0, 50)}${alt.length > 50 ? '...' : ''}"`);
    }
  }
  
  // 3. Check buttons and interactive elements
  const buttons = await page.locator('button, [role="button"]').all();
  console.log(`\n=== Button Accessibility Check (${buttons.length} buttons) ===`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const tagName = await button.evaluate(el => el.tagName.toLowerCase());
    const role = await button.getAttribute('role');
    const ariaLabel = await button.getAttribute('aria-label');
    const textContent = await button.textContent();
    const title = await button.getAttribute('title');
    
    console.log(`\nButton ${i + 1} (${tagName}${role ? `, role="${role}"` : ''}):`);
    
    // Check if button has accessible name
    const hasAccessibleName = ariaLabel || textContent?.trim() || title;
    
    if (!hasAccessibleName) {
      console.log(`✗ CRITICAL: No accessible name (no aria-label, text content, or title)`);
      console.log(`  HTML: ${await button.evaluate(el => el.outerHTML.substring(0, 200))}`);
    } else {
      console.log(`✓ Has accessible name`);
      if (ariaLabel) console.log(`  aria-label: "${ariaLabel}"`);
      if (textContent?.trim()) console.log(`  text: "${textContent.trim().substring(0, 50)}${textContent.trim().length > 50 ? '...' : ''}"`);
      if (title) console.log(`  title: "${title}"`);
    }
    
    // Check if button is focusable
    const tabIndex = await button.getAttribute('tabindex');
    const isDisabled = await button.getAttribute('disabled');
    
    if (isDisabled) {
      console.log(`  Note: Button is disabled`);
    } else if (tagName === 'button' || role === 'button') {
      console.log(`  ✓ Focusable by default`);
    } else if (tabIndex !== null && tabIndex !== '-1') {
      console.log(`  ✓ Focusable via tabindex="${tabIndex}"`);
    } else {
      console.log(`✗ WARNING: May not be focusable`);
    }
  }
  
  // 4. Check form elements
  const formElements = await page.locator('input, textarea, select').all();
  console.log(`\n=== Form Elements Check (${formElements.length} elements) ===`);
  
  for (let i = 0; i < Math.min(formElements.length, 5); i++) {
    const element = formElements[i];
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const id = await element.getAttribute('id');
    const ariaLabel = await element.getAttribute('aria-label');
    const placeholder = await element.getAttribute('placeholder');
    
    console.log(`\n${tagName.toUpperCase()} ${i + 1}:`);
    
    if (id) {
      const label = await page.locator(`label[for="${id}"]`).first();
      if (await label.count() > 0) {
        const labelText = await label.textContent();
        console.log(`✓ Has associated label: "${labelText?.trim()}"`);
      } else {
        console.log(`✗ Has id="${id}" but no associated <label for="${id}">`);
      }
    } else if (ariaLabel) {
      console.log(`✓ Has aria-label: "${ariaLabel}"`);
    } else if (placeholder) {
      console.log(`⚠ Using placeholder as label: "${placeholder}" (not recommended)`);
    } else {
      console.log(`✗ No accessible label`);
    }
  }
  
  // 5. Check color contrast (basic)
  console.log(`\n=== Color Contrast Check ===`);
  const heroText = await page.locator('h1').first();
  const heroColor = await heroText.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.color;
  });
  
  console.log(`Hero text color: ${heroColor}`);
  console.log(`Expected: white or very light color for dark background`);
  
  // 6. Check semantic structure
  console.log(`\n=== Semantic Structure ===`);
  const hasMain = await page.locator('main').count() > 0;
  const hasHeader = await page.locator('header').count() > 0;
  const hasFooter = await page.locator('footer').count() > 0;
  const hasNav = await page.locator('nav').count() > 0;
  
  console.log(`✓ Main element: ${hasMain ? 'Yes' : 'No (CRITICAL)'}`);
  console.log(`✓ Header element: ${hasHeader ? 'Yes' : 'No'}`);
  console.log(`✓ Footer element: ${hasFooter ? 'Yes' : 'No'}`);
  console.log(`✓ Nav element: ${hasNav ? 'Yes' : 'No'}`);
  
  // 7. Check keyboard navigation
  console.log(`\n=== Keyboard Navigation Test ===`);
  await page.keyboard.press('Tab');
  console.log(`First Tab: Focus should move to first interactive element`);
  
  // Take screenshot for reference
  await page.screenshot({ path: 'accessibility-audit.png', fullPage: true });
  
  console.log(`\n=== Summary ===`);
  console.log(`Screenshot saved: accessibility-audit.png`);
  console.log(`Run full WCAG audit with browser dev tools for complete assessment.`);
  
  await browser.close();
}

checkAccessibility().catch(console.error);