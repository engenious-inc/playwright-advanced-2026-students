import { test, expect } from '../../shared/fixtures/index.js';

// Committed proof behind E05. Tags + grep (E5.A), web-first assertions (E5.B),
// grouped describe for reports (E5.C). Config map is lecture-only (E5.A).

test.describe('E5.A: tag and filter with --grep', () => {
  test('smoke: home shell loads @essentials @smoke', async ({ mockTubiHome }) => {
    await mockTubiHome.goto();

    await expect(mockTubiHome.searchBox).toBeVisible();
  });

  test('essentials: Movies nav is reachable @essentials', async ({ page, mockTubiHome }) => {
    await mockTubiHome.goto();
    await mockTubiHome.openMovies();

    await expect(page).toHaveURL(/#\/movies/);
  });
});

test.describe('E5.B: web-first assertions', () => {
  test('search box accepts input without manual waits', async ({ mockTubiHome }) => {
    await mockTubiHome.goto();
    await mockTubiHome.fillSearch('documentary');

    await expect(mockTubiHome.searchBox).toHaveValue('documentary');
  });
});
