/**
 * M07 lecture 7.D — Claude Code + MCP on Tubi (live)
 *
 * Final state of the test Claude Code generated when prompted to write a
 * Tubi-browse test using the Playwright MCP server, the typed fixtures, and
 * the `TubiHomePage` adapter (per CLAUDE.md conventions).
 *
 * On its first generation, Claude reached for `tubiHome.browseCategory('Movies')`
 * which clicks a *link* in the category nav. Movies is actually a *menuitem*
 * in the top menubar — different role. The test failed at the adapter boundary.
 *
 * **The lecture's teaching moment:** fix the ADAPTER, not the test.
 * `browseMenuItem` was added to `TubiHomePage`. Claude regenerated using the
 * new method. Test passes. The adapter absorbed the volatility; the test stayed
 * clean.
 *
 * Compare against ./01-codegen-result.spec.ts (brittle, no adapter use) and
 * ./03-test-agents-result.spec.ts (Test Agents flow).
 */

import { test, expect } from '../../shared/fixtures/index.js';
import { skipInHeadless, skipOnMobile } from '../../shared/test-guards.js';

test(
  'Movies page is reachable via menubar',
  { tag: '@desktop-menubar' },
  async ({ tubiHome, page }) => {
    skipOnMobile('Desktop menubar navigation');
    await tubiHome.goto();
    await tubiHome.browseMenuItem('Movies');
    await expect(page).toHaveURL(/\/movies/);
    await expect(tubiHome.categoryNav).toBeVisible();
  },
);

test('Movies page renders content tiles after lazy-load', async ({ tubiHome }) => {
  skipOnMobile('Movies menubar navigation is desktop-only');
  skipInHeadless('Tubi lazy-loaded tiles need headed mode');
  await tubiHome.goto();
  await tubiHome.browseMenuItem('Movies');
  await tubiHome.triggerLazyLoad();
  expect(await tubiHome.contentTiles.count()).toBeGreaterThanOrEqual(12);
});
