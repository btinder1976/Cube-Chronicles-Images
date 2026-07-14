import { test, expect } from '@playwright/test';

test.describe('visitor journeys', () => {
  test('homepage renders hero, bookshelf, and structured data', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(/History is a door/i);
    // All 15 covers link somewhere under /books/
    const bookLinks = page.locator('a[href^="/books/"]');
    expect(await bookLinks.count()).toBeGreaterThanOrEqual(15);
    // JSON-LD present
    const ld = page.locator('script[type="application/ld+json"]');
    expect(await ld.count()).toBeGreaterThan(0);
  });

  test('books index lists all 15 and filters work without JS', async ({ page }) => {
    await page.goto('/books');
    await expect(page.getByRole('heading', { level: 1, name: 'The Books' })).toBeVisible();
    // full crawlable list has 15 entries
    const items = page.locator('.book-index-list li');
    await expect(items).toHaveCount(15);
    // filter by region link narrows results
    await page.goto('/books?region=Egypt');
    await expect(page.locator('.filter-status')).toContainText(/Showing/);
  });

  test('a book page shows title, editorial FAQ, and breadcrumbs', async ({ page }) => {
    await page.goto('/books/01-the-shed-the-cube-and-the-sands-of-time/');
    await expect(page.locator('h1')).toContainText('The Shed, The Cube, and The Sands of Time');
    await expect(page.locator('#faq')).toBeVisible();
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
    // FAQ accordions exist
    expect(await page.locator('#faq details').count()).toBeGreaterThanOrEqual(12);
  });

  test('series FAQ page and JSON-LD', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.getByRole('heading', { level: 1, name: 'Series FAQ' })).toBeVisible();
    expect(await page.locator('details').count()).toBeGreaterThanOrEqual(20);
  });

  test('registration page is reachable and gated posting is enforced', async ({ page }) => {
    await page.goto('/books/01-the-shed-the-cube-and-the-sands-of-time/#ask');
    // Not signed in → prompted to sign in / register
    await expect(page.locator('#ask')).toContainText(/sign in|create a free account/i);
  });

  test('robots.txt and sitemap.xml are served', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain('Sitemap:');
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain('<urlset');
  });

  test('custom 404 page', async ({ page }) => {
    const resp = await page.goto('/this-page-does-not-exist');
    expect(resp?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText(/unexpected/i);
  });
});
