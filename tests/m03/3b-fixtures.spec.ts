import { test, expect } from '../../shared/fixtures/index.js';

// ESM has no __dirname; resolve fixture paths relative to this module's URL instead.
const v1 = new URL('./fixtures/tubi-search-v1.html', import.meta.url).href;
const v2 = new URL('./fixtures/tubi-search-v2.html', import.meta.url).href;

// The fixtures use real Tubi class vocabulary (web-carousel / web-content-tile__container /
// a.web-content-tile__title, from a live tubitv.com recon) and real Tubi poster art. v1 uses
// those classes; v2 renames them (web-lane / web-tile / web-tile__title) while keeping identical
// accessible semantics. "Now You See Me" is the referenced tile (real poster on the live site).
const BRITTLE = 'div.web-carousel > div.web-content-tile__container'; // real Tubi structural chain

test('v1: role+name locators resolve', async ({ page }) => {
  await page.goto(v1);
  await expect(page.getByRole('link', { name: 'Movies', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Now You See Me' })).toBeVisible();
  // scope by the row's accessible name, then the title link inside it
  await expect(
    page
      .getByRole('region', { name: /trending now/i })
      .getByRole('link', { name: 'Now You See Me' }),
  ).toBeVisible();
});

test('v1: brittle CSS chain matches', async ({ page }) => {
  await page.goto(v1);
  // Raw CSS locator is intentional here — this test proves the brittle-vs-resilient contrast (not a rule-4 violation).
  await expect(page.locator(BRITTLE)).toHaveCount(8); // 2 rows x 4 tiles
});

test('v2: role+name still resolves (survives restructure)', async ({ page }) => {
  await page.goto(v2);
  await expect(page.getByRole('link', { name: 'Now You See Me' })).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: /trending now/i })
      .getByRole('link', { name: 'Now You See Me' }),
  ).toBeVisible();
});

test('v2: brittle CSS chain no longer matches', async ({ page }) => {
  await page.goto(v2);
  // Raw CSS locator is intentional here — this test proves the brittle-vs-resilient contrast (not a rule-4 violation).
  await expect(page.locator(BRITTLE)).toHaveCount(0);
});
