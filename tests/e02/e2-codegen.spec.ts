import { test, expect } from '../../shared/fixtures/index.js';
import { MockTubi, installMockTubiShell } from '../../shared/anchor-helpers/tubi/mock-endpoints.js';
import { THREE_CATEGORIES } from '../e01/fixtures/categories.js';

// The committed proof behind every on-camera claim in E02 (codegen is a draft, not the test
// you keep). Beginners copy the first test. It is the rewritten recording: the locators codegen
// emitted, pointed at the mocked Tubi shell so the run can only go red because of their code.

test('E2.D: fills search with comedy', async ({ page }) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await page.getByRole('textbox', { name: 'Search Tubi' }).fill('comedy');

  await expect(page.getByRole('textbox', { name: 'Search Tubi' })).toHaveValue('comedy');
});

test('E2.A: pick locator resolves the search box and the Movies link', async ({ page }) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await expect(page.getByRole('textbox', { name: 'Search Tubi' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Movies', exact: true })).toBeVisible();
});

test('E2.C: record at cursor added the Movies click to a test that already opened the page', async ({
  page,
}) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await page.getByRole('link', { name: 'Movies', exact: true }).click();

  await expect(page).toHaveURL(/#\/movies/);
});

test('E2.D: the recording never leaves the mocked shell', async ({ page }) => {
  const requestedHosts = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') requestedHosts.add(url.host);
  });

  await installMockTubiShell(page, THREE_CATEGORIES);
  const response = await page.goto(MockTubi.pageUrl);
  await page.getByRole('textbox', { name: 'Search Tubi' }).fill('comedy');
  await page.waitForLoadState('load');

  expect(response?.url()).toBe(MockTubi.pageUrl);
  expect([...requestedHosts]).toEqual(['tubi.mock.test']);
});
