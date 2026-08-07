import { test, expect } from '@playwright/test';

/**
 * 16.H failure mode 3 — "refactors that lose coverage."
 *
 * The capstone refactor makes a tangled suite readable: extract a helper, collapse duplication,
 * push assertions into shared setup. Every step keeps the suite green, and green is the signal
 * everyone trusts during a refactor.
 *
 * But green only tells you the tests still PASS. It says nothing about whether they still CHECK.
 * Fold an assertion into a helper and forget to call it, or extract a helper that asserts nothing,
 * and the test count is unchanged, the runtime improves, the diff looks like tidying — and a
 * regression can now walk straight through.
 *
 * A test suite is the one codebase where deleting work makes the metrics look better.
 *
 * Fix: verify the refactor the way you verify a bug fix — break the behaviour on purpose and
 * confirm the suite goes red. A refactor that keeps a mutation undetected removed coverage,
 * whatever the pass count says.
 */

type Order = { id: string; total: number; currency: string };

const order: Order = { id: 'A-1', total: 42, currency: 'USD' };

/** Before: verbose, duplicated — and it genuinely checks three things. */
function checkOrderVerbose(o: Order) {
  expect(o.id).toBe('A-1');
  expect(o.total).toBe(42);
  expect(o.currency).toBe('USD');
}

/**
 * After: tidy, shared, reads better. And it quietly stopped checking `total` — the one field a
 * pricing regression would move.
 */
function checkOrderRefactored(o: Order) {
  expect(o.id).toBe('A-1');
  expect(o.currency).toBe('USD');
}

/** Same broken-behaviour probe you would use on a bug fix. */
function detectsRegression(check: (o: Order) => void): boolean {
  try {
    check({ ...order, total: 999_999 });
    return false; // survived a regression it should have caught
  } catch {
    return true;
  }
}

test('both versions pass on good data — which is why the refactor looks safe', async () => {
  checkOrderVerbose(order);
  checkOrderRefactored(order);
});

test('THE FAILURE — the refactored check no longer catches a pricing regression', async () => {
  expect(detectsRegression(checkOrderVerbose)).toBe(true);

  // Same green suite, same test count, faster. And a 42 -> 999999 change now ships.
  expect(detectsRegression(checkOrderRefactored)).toBe(false);
});

test('THE FIX — gate the refactor on mutation detection, not on the pass count', async () => {
  // Run this against the pre- and post-refactor helpers and require the same verdict. It is the
  // assertion that would have blocked the commit above.
  const before = detectsRegression(checkOrderVerbose);
  const after = detectsRegression(checkOrderRefactored);
  expect(
    before && !after,
    'refactor dropped coverage: a regression that was caught now survives',
  ).toBe(true);
});
