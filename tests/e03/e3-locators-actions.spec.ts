import { test, expect } from '../../shared/fixtures/index.js';
import { MockTubi, installMockTubiShell } from '../../shared/anchor-helpers/tubi/mock-endpoints.js';
import { THREE_CATEGORIES } from '../e01/fixtures/categories.js';

// The committed proof behind every on-camera claim in E03. Beginners copy these tests.
// The page is the mocked Tubi shell, so a run can only go red because of the test.

test('E3.A: getByRole resolves the search box, and Movies is exact because the name matches five links', async ({
  page,
}) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await expect(page.getByRole('textbox', { name: 'Search Tubi' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Movies' })).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'Movies', exact: true })).toBeVisible();
});

test('E3.B: click, fill, check, select, and Enter each change the page', async ({ page }) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await page.getByRole('link', { name: 'Movies', exact: true }).click();
  await expect(page).toHaveURL(/#\/movies/);

  await page.getByRole('textbox', { name: 'Search Tubi' }).fill('comedy');
  await page.getByRole('checkbox', { name: 'Free with ads' }).check();
  await page.getByRole('combobox', { name: 'Sort' }).selectOption('Newest');
  await page.getByRole('textbox', { name: 'Search Tubi' }).press('Enter');

  await expect(page.getByRole('checkbox', { name: 'Free with ads' })).toBeChecked();
  await expect(page.getByRole('combobox', { name: 'Sort' })).toHaveValue('Newest');
  await expect(page.getByRole('status')).toHaveText('Results for comedy');
  await expect(page).toHaveURL(/#\/search/);
});

test('E3.C: web-first assertions see the Comedy row and the search value', async ({ page }) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await page.getByRole('textbox', { name: 'Search Tubi' }).fill('comedy');

  await expect(page.getByRole('region', { name: 'Comedy' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search Tubi' })).toHaveValue('comedy');
});

test('E3.D: Free with ads can be asserted checked', async ({ page }) => {
  await installMockTubiShell(page, THREE_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await page.getByRole('checkbox', { name: 'Free with ads' }).check();

  await expect(page.getByRole('checkbox', { name: 'Free with ads' })).toBeChecked();
});

test('E3.A: the locators never leave the mocked shell', async ({ page }) => {
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
