/**
 * `npm run brag` demo test — the first-clone wow moment.
 *
 * Pre-staged output of the Playwright Test Agents loop (plan:
 * `specs/tubi-brag.md`). Committed so a brand-new clone has a real,
 * green Tubi test to run in seconds — without needing a live agent
 * session or an API key. M07 teaches how a test like this is generated.
 *
 * Deliberately asserts only on stable elements (title, logo, nav, route),
 * not lazy-loaded tile counts, so the demo is reliably green on first run.
 */

import { test, expect } from '../../shared/fixtures/index.js';

test('Tubi home loads with branding and navigation', async ({ tubiHome, page }) => {
  await tubiHome.goto();
  await expect(page).toHaveTitle(/Watch Free Movies and TV Shows Online \| Tubi/i);
  await expect(tubiHome.tubiLogo.first()).toBeVisible();
  await expect(tubiHome.categoryNav).toBeVisible();
});

test(
  'Tubi browses to Movies via the menubar',
  { tag: '@desktop-menubar' },
  async ({ tubiHome, page }) => {
    await tubiHome.goto();
    await tubiHome.browseMenuItem('Movies');
    await expect(page).toHaveURL(/\/movies/);
  },
);
