import { expect, test } from '@playwright/test';
import path from 'path';

const publicRoutes = [
  '/',
  '/events',
  '/events/archive',
  '/workshops',
  '/resources',
  '/login',
  '/signup',
  '/forgot-password',
  '/register',
];

test.beforeEach(async ({ page }) => {
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

test('public routes load with metadata and without console errors', async ({ page }, testInfo) => {
  for (const route of publicRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `${route} status`).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
  }

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/CampusCoder/i);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /student coding community/i);
  await expect(page.locator('link[rel~="icon"]')).toHaveCount(1);

  const screenshotPath = path.join('docs', 'qa-screenshots', `home-${testInfo.project.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const consoleErrors = await page.evaluate(async () => window.__consoleErrors());
  expect(consoleErrors).toEqual([]);
});

test('mobile navigation opens and exposes key links', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const eventsLinksBefore = await page.locator('a[href="/events"]').count();
  await page.getByRole('button', { name: /open navigation menu/i }).click();
  await expect.poll(() => page.locator('a[href="/events"]').count()).toBeGreaterThan(eventsLinksBefore);
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await page.screenshot({ path: path.join('docs', 'qa-screenshots', `home-mobile-${testInfo.project.name}.png`), fullPage: true });
});

test('protected student and admin routes redirect anonymous users to login', async ({ page }) => {
  for (const route of ['/dashboard', '/admin']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  }
});

test('registration form shows validation before submit reaches server', async ({ page }) => {
  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /confirm community rsvp/i }).click();
  await expect.poll(async () => page.locator('input:invalid, select:invalid, textarea:invalid').count()).toBeGreaterThan(0);
});

test('home page internal links are reachable', async ({ page, request }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) => [
    ...new Set(
      anchors
        .map((anchor) => (anchor as HTMLAnchorElement).href)
        .filter((href) => href.startsWith(window.location.origin))
    ),
  ]);

  for (const href of hrefs.slice(0, 30)) {
    const response = await request.get(href);
    expect(response.status(), href).toBeLessThan(400);
  }
});

declare global {
  interface Window {
    __consoleErrors: () => Promise<string[]>;
  }
}
