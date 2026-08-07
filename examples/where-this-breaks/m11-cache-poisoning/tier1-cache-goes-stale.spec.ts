import { test, expect } from '@playwright/test';

/**
 * 11.F failure mode 1 — "Tier 1 cache poisoning."
 *
 * The tiered resolver caches what a description resolved to, so the next lookup is free instead of
 * costing an LLM round-trip. That cache is the entire economic argument for the tiered model: Tier
 * 1 has to be nearly free, or the ladder is pointless.
 *
 * The cache is also the failure. It is keyed on the DESCRIPTION, not on the page. When the UI
 * changes underneath it, a stale entry keeps resolving — confidently, instantly, and to the wrong
 * control. Worse than a miss: a miss escalates to Tier 2 and self-corrects, while a poisoned hit
 * never escalates at all, because as far as the resolver is concerned it already succeeded.
 *
 * A cheap, confident, wrong answer is the most expensive kind. The test clicks the wrong button
 * and reports on whatever happened next.
 *
 * Fix: key the cache on something that changes when the page changes, and always VALIDATE a
 * cached hit against the live DOM before returning it. A cache that cannot be wrong is worth less
 * than a cache you re-check.
 */

/** Minimal stand-in for `shared/tiered-ai/`'s Tier 1 cache — same shape, no SDK required. */
class Tier1Cache {
  private hits = new Map<string, string>();

  /** The naive version: description -> selector, trusted forever. */
  resolveUnchecked(description: string, resolve: () => string): string {
    const cached = this.hits.get(description);
    if (cached) return cached;
    const found = resolve();
    this.hits.set(description, found);
    return found;
  }

  /** The fixed version: a cached hit must still be valid on the page in front of us. */
  resolveChecked(description: string, resolve: () => string, isValid: (sel: string) => boolean) {
    const cached = this.hits.get(description);
    if (cached && isValid(cached)) return cached;
    const found = resolve();
    this.hits.set(description, found);
    return found;
  }
}

const V1 = `
  <button id="btn-confirm">Confirm order</button>
  <button id="btn-cancel">Cancel order</button>
`;

// A redesign: the ids swap meaning. Structurally valid, semantically inverted — exactly the kind
// of change a rename or a component refactor produces.
const V2 = `
  <button id="btn-cancel">Confirm order</button>
  <button id="btn-confirm">Cancel order</button>
`;

test('THE FAILURE — a cached hit resolves to the wrong control after a redesign', async ({
  page,
}) => {
  const cache = new Tier1Cache();

  await page.setContent(V1);
  // First resolve: genuinely correct, and cached.
  const first = cache.resolveUnchecked('the confirm button', () => 'btn-confirm');
  expect(first).toBe('btn-confirm');
  await expect(page.locator(`#${first}`)).toHaveText('Confirm order');

  await page.setContent(V2);
  // Second resolve: instant, confident, and now pointing at Cancel. No error, no escalation.
  const second = cache.resolveUnchecked('the confirm button', () => 'btn-cancel');
  expect(second).toBe('btn-confirm');
  await expect(page.locator(`#${second}`)).toHaveText('Cancel order');

  // The test that used this resolver just clicked Cancel believing it clicked Confirm.
});

test('THE FIX — validate the cached hit against the live DOM before trusting it', async ({
  page,
}) => {
  const cache = new Tier1Cache();
  const isConfirm = async (id: string) =>
    (await page.locator(`#${id}`).textContent()) === 'Confirm order';

  await page.setContent(V1);
  const first = cache.resolveChecked(
    'the confirm button',
    () => 'btn-confirm',
    () => true,
  );
  expect(first).toBe('btn-confirm');

  await page.setContent(V2);
  // The cached entry no longer describes what it claims, so it is discarded and re-resolved.
  const stillValid = await isConfirm('btn-confirm');
  const second = cache.resolveChecked(
    'the confirm button',
    () => 'btn-cancel',
    () => stillValid,
  );

  expect(second).toBe('btn-cancel');
  await expect(page.locator(`#${second}`)).toHaveText('Confirm order');
});
