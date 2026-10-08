import { test, expect } from '../../shared/fixtures/index.js';
import { MockTubi, installMockTubiShell } from '../../shared/anchor-helpers/tubi/mock-endpoints.js';
import { THREE_CATEGORIES } from './fixtures/categories.js';

// The committed proof behind every on-camera claim in E01 (E1.D "Run tests, read the HTML report").
// The first test a beginner ever runs must be hermetic: it runs against the mocked Tubi shell, so
// it can only go red because of their code, never because real Tubi changed that morning.

test('E1.D: the first test opens Tubi and finds the page title', async ({ page }) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await expect(page).toHaveTitle(/Tubi/);
});

test('E1.D: the home page shows the primary navigation and the search box', async ({ page }) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search Tubi' })).toBeVisible();
});

test('E1.D: the categories on screen are exactly the ones we handed the page', async ({ page }) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(3);
  await expect(page.getByRole('region', { name: 'Comedy' })).toBeVisible();
});

test('E1.D: the test never leaves the mocked shell (hermetic first run)', async ({ page }) => {
  // Every HTTP(S) request the page makes, not just where it ends up: the shell HTML is shared with
  // M04, so a CDN font or script added there would reach the network while the final URL stayed put.
  const requestedHosts = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') requestedHosts.add(url.host);
  });

  await installMockTubiShell(page, THREE_CATEGORIES);
  const response = await page.goto(MockTubi.pageUrl);
  await page.waitForLoadState('load');

  expect(response?.url()).toBe(MockTubi.pageUrl);
  expect([...requestedHosts]).toEqual(['tubi.mock.test']);
});
