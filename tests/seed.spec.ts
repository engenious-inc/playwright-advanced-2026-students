import { test, expect } from '../shared/fixtures/index.js';

/**
 * Seed test for Playwright Test Agents.
 *
 * Test Agents read this file before they generate new tests, to learn:
 *   - which fixture module to import from (`../shared/fixtures/index.js`)
 *   - which page-object fixture name to use (`tubiHome`)
 *   - the assertion style this project uses (web-first `expect(...)` chains)
 *   - where files belong (`tests/` at the project root)
 *
 * Keep this file minimal. The planner and generator mirror its style verbatim.
 * If you want generated tests to follow a new convention, demonstrate the
 * convention here first, then let the agents pick it up.
 *
 * Referenced in M07 lecture 7.F (Playwright Test Agents — concept).
 */
test('seed: tubi home reaches title', async ({ tubiHome, page }) => {
  await tubiHome.goto();
  await expect(page).toHaveTitle(/Watch Free Movies and TV Shows Online \| Tubi/i);
});
