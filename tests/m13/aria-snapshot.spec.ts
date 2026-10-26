import { test, expect } from '../../shared/fixtures/index.js';

/**
 * M13 — ARIA snapshot structural assertion on the hermetic Tubi category nav.
 * Runs against the mock shell, so the baseline only changes when the mock or the nav structure does.
 */
test.describe('M13 ARIA snapshots', () => {
  test(
    'category nav matches structural baseline',
    { tag: '@desktop-nav' },
    async ({ mockTubiHome }) => {
      await mockTubiHome.goto();
      await expect(mockTubiHome.categoryNav).toMatchAriaSnapshot({
        name: 'tubi-category-nav.aria.yml',
      });
    },
  );
});
