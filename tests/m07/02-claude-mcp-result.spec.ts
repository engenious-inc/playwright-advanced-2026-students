/**
 * M07 lecture 7.D — Claude Code + MCP on Tubi (live)
 *
 * Final state of the test Claude Code generated when prompted to write a
 * Tubi-browse test using the Playwright MCP server, the typed fixtures, and
 * the `TubiHomePage` adapter (per CLAUDE.md conventions).
 *
 * This is an earlier (July 2026) run's final state. The run 7.D shows
 * (2026-09-24, docs/modules/M07-three-ways-to-generate-code/transcripts/) went:
 * the agent wrote a test using `browseCategory('Movies')`, which looked for a
 * *link* — but Movies is a *menuitem* in the top menubar. The test failed at
 * the adapter boundary; the agent fixed the adapter (not the test) by rewriting
 * browseCategory, and review split that into its own `browseMenuItem` method.
 * `browseCategory` has since been deleted: it matched nothing on live Tubi.
 *
 * **The lecture's teaching moment:** fix the ADAPTER, not the test — and
 * review how.
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
  await tubiHome.waitForCarouselsLoaded();
  expect(await tubiHome.contentTiles.count()).toBeGreaterThanOrEqual(12);
});
