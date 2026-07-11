import { test, expect } from '@playwright/test';
import { tieredLocate } from '../../shared/tiered-ai/tiered-locator.js';
import { _resetTier1Cache } from '../../shared/tiered-ai/tier1-deterministic.js';

/**
 * M11 — orchestrator wiring with the real deterministic tier 1 (11.B) and the
 * OFFLINE_MODE gate. Tier 1 needs no API key, so these run everywhere.
 */
test.describe('M11 tiered locator orchestrator (OFFLINE_MODE)', () => {
  test.beforeEach(() => {
    _resetTier1Cache();
    process.env.OFFLINE_MODE = 'true';
  });

  test.afterEach(() => {
    delete process.env.OFFLINE_MODE;
    _resetTier1Cache();
  });

  test('tier 1 resolves a clear structural match', async ({ page }) => {
    await page.setContent('<main><button type="button">Submit</button></main>');
    const result = await tieredLocate(page, 'Submit button');
    expect(result).toEqual({
      kind: 'selector',
      selector: 'role=button[name="Submit"]',
      confidence: 1,
      tier: 1,
    });
  });

  test('fails when tier 1 misses and no higher tier is available offline', async ({ page }) => {
    await page.setContent('<main><button type="button">Submit</button></main>');
    const result = await tieredLocate(page, 'the spaceship launch lever');
    expect(result).toEqual({
      kind: 'fail',
      reason: 'OFFLINE_MODE — tier 1 only and no match',
    });
  });
});
