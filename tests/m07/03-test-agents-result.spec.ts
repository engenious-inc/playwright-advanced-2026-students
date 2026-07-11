/**
 * M07 lecture 7.G — Test Agents on Tubi (live)
 *
 * Final state after the full agentic loop ran:
 *   1. The planner explored Tubi, produced specs/m07-tubi-browse.md
 *   2. Greg reviewed the plan, removed a hallucinated scenario, fixed a URL pattern
 *   3. The generator turned the corrected plan into this file
 *   4. The first test run failed — Movies-page tiles didn't render headless
 *   5. The healer proposed a `waitForTimeout` band-aid — Greg REJECTED IT
 *   6. The fix went into the adapter (`triggerLazyLoad`), not the test
 *   7. Generator regenerated the affected test; suite passes
 *
 * **Headline lesson from 7.G:** the healer is a productivity multiplier AND
 * a regression-hiding device. Tell the difference. The patch the healer
 * proposed (`page.waitForTimeout(2000)`) would have made the test green
 * by papering over the real issue — Tubi's lazy-load behavior — instead
 * of giving the adapter a knowable, reusable solution.
 *
 * Compare against ./01-codegen-result.spec.ts and ./02-claude-mcp-result.spec.ts.
 */

import { test, expect } from '../../shared/fixtures/index.js';
import { skipInHeadless, skipOnMobile } from '../../shared/test-guards.js';

test('Browse menubar exposes the Movies item', async ({ tubiHome, page }) => {
  await tubiHome.goto();
  await expect(tubiHome.categoryNav).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Movies' })).toBeVisible();
});

test('Movies page renders at least 12 content tiles', async ({ tubiHome }) => {
  skipOnMobile('Movies menubar navigation is desktop-only');
  skipInHeadless('Tubi lazy-loaded tiles need headed mode');
  await tubiHome.goto();
  await tubiHome.browseMenuItem('Movies');
  await tubiHome.triggerLazyLoad();
  expect(await tubiHome.contentTiles.count()).toBeGreaterThanOrEqual(12);
});

test('clicking a content tile opens a detail page', async ({ tubiHome, page }) => {
  skipOnMobile('Movies menubar navigation is desktop-only');
  skipInHeadless('Tubi lazy-loaded tiles need headed mode');
  await tubiHome.goto();
  await tubiHome.browseMenuItem('Movies');
  await tubiHome.triggerLazyLoad();
  await tubiHome.openFirstContentTile();
  await expect(page).toHaveURL(/\/movies\/\d+/);
  await expect(
    page.getByRole('button', { name: /play/i }).or(page.getByRole('button', { name: /pause/i })),
  ).toBeVisible({ timeout: 15_000 });
});
