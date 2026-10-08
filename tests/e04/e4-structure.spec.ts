import { test, expect } from '../../shared/fixtures/index.js';
import { MockTubiHomePage } from '../../shared/anchor-helpers/tubi/MockTubiHomePage.js';
import {
  MockTubi,
  installMockTubiShell,
  MOCK_SHELL_CATEGORIES,
} from '../../shared/anchor-helpers/tubi/mock-endpoints.js';

// The committed proof behind E04. Setup moves into a hook, locators move into the page
// object, the fixture builds that object, and one body runs once per row.

test.describe('E4.A: the hook opens the mocked page', () => {
  test.beforeEach(async ({ page }) => {
    await installMockTubiShell(page, MOCK_SHELL_CATEGORIES);
    await page.goto(MockTubi.pageUrl);
  });

  test('the search box is already there', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Search Tubi' })).toBeVisible();
  });

  test('the Movies link is already there', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Movies', exact: true })).toBeVisible();
  });
});

test('E4.B: the page object fills search and opens Movies', async ({ page }) => {
  await installMockTubiShell(page, MOCK_SHELL_CATEGORIES);
  const home = new MockTubiHomePage(page);

  await home.goto();
  await home.fillSearch('comedy');
  await expect(home.searchBox).toHaveValue('comedy');
  await home.openMovies();
  await expect(page).toHaveURL(/#\/movies/);
});

test('E4.C: the fixture hands over a page object that can search', async ({ mockTubiHome }) => {
  await mockTubiHome.goto();
  await mockTubiHome.fillSearch('comedy');

  await expect(mockTubiHome.searchBox).toHaveValue('comedy');
});

for (const category of MOCK_SHELL_CATEGORIES) {
  test(`E4.D: the ${category.name} row is on the page`, async ({ mockTubiHome }) => {
    await mockTubiHome.goto();

    await expect(mockTubiHome.row(category.name)).toBeVisible();
  });
}

test('E4.D: Free with ads is checked through the page object', async ({ mockTubiHome }) => {
  await mockTubiHome.goto();
  await mockTubiHome.checkFreeWithAds();

  await expect(mockTubiHome.freeWithAds).toBeChecked();
});
