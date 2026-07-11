import { test, expect } from '@playwright/test';
import { tier2Locate } from '../../shared/tiered-ai/tier2-a11y-llm.js';

/**
 * M11 — live tier-2 smoke against the real Anthropic API (11.C).
 * This is the one spec that actually spends money, so it is opt-in: run it
 * deliberately with `M11_LIVE=1 ANTHROPIC_API_KEY=sk-... npm run test:m11`.
 * (Gating on an explicit flag — not merely key presence — avoids firing on a
 * stale key that happens to sit in the shell env.)
 */
test.describe('M11 tier 2 (live)', () => {
  test.skip(
    process.env.M11_LIVE !== '1' || !process.env.ANTHROPIC_API_KEY,
    'set M11_LIVE=1 and a valid ANTHROPIC_API_KEY to run',
  );

  test('resolves a real query against a live Sonnet call', async ({ page }) => {
    await page.setContent(
      '<main><form><label>Email <input type="email" /></label>' +
        '<button type="submit">Sign in</button></form></main>',
    );
    const result = await tier2Locate(page, 'the button that submits the sign-in form');
    // A clear query on a real form should resolve at tier 2.
    expect(result).not.toBeNull();
    expect(result?.tier).toBe(2);
    expect((result?.selector ?? '').length).toBeGreaterThan(0);
    expect(result?.confidence ?? 0).toBeGreaterThanOrEqual(0.7);
  });
});
