import { test, expect } from '../../shared/fixtures/index.js';

/**
 * M13 — ARIA snapshot structural assertion on Tubi category nav.
 * Skipped on CI (live Tubi); run locally and update baselines after nav changes.
 */
test.describe('M13 ARIA snapshots', () => {
  test(
    'category nav matches structural baseline',
    { tag: '@desktop-nav' },
    async ({ tubiHome }) => {
      test.skip(!!process.env.CI, 'live Tubi is not a deterministic CI target');
      await tubiHome.goto();
      await expect(tubiHome.categoryNav).toMatchAriaSnapshot({
        name: 'tubi-category-nav.aria.yml',
      });
    },
  );
});
