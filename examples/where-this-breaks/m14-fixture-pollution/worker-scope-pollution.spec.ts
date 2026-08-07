import { test as base, expect } from '@playwright/test';

/**
 * 14.E failure mode 3 — "worker-scope mutable state pollution."
 *
 * A worker-scoped fixture is created once per worker process and shared by every test that worker
 * runs. That is exactly why you reach for one: it is the cheap way to avoid re-doing expensive
 * setup. The cost is that the object is SHARED, so a test that mutates it hands the mutation to
 * every test that follows.
 *
 * The result is the worst kind of flake: order-dependent. Run the offending test alone and it
 * passes. Run the file and a later test fails. Shard differently and the failure moves to a
 * different test — or disappears, which is worse, because you will assume you fixed it.
 *
 * Fix: keep worker-scoped fixtures IMMUTABLE, and put anything a test mutates in a test-scoped
 * fixture, which is rebuilt per test.
 */

// `sharedCart` is worker-scoped: created once and handed to every test in the worker — mutating
// it is the trap. `ownCart` is test-scoped: rebuilt per test, so mutation cannot escape.
const test = base.extend<{ ownCart: string[] }, { sharedCart: string[] }>({
  sharedCart: [
    async ({}, use) => {
      await use([]); // created ONCE per worker
    },
    { scope: 'worker' },
  ],
  ownCart: async ({}, use) => {
    await use([]); // created per TEST
  },
});

// Deliberately NOT `mode: 'serial'`. Serial would skip everything after the first failure, hiding
// the fixes. Playwright already runs a file's tests in declaration order in one worker, which is
// all this demo needs — and that ordinary default is precisely why the bug is easy to ship.

test('adds an item to the worker-scoped cart', async ({ sharedCart }) => {
  sharedCart.push('sku-1');
  expect(sharedCart).toHaveLength(1);
});

test("THE FAILURE — a later test inherits the previous test's mutation", async ({ sharedCart }) => {
  // This test never touched sharedCart, and in isolation it passes. Run after the test above and
  // the array already holds 'sku-1'. Nothing in this test's own code explains the failure, which
  // is what makes the real-world version so expensive to track down.
  expect(sharedCart).toHaveLength(0);
});

test('THE FIX — a test-scoped fixture is rebuilt, so tests cannot leak into each other', async ({
  ownCart,
}) => {
  ownCart.push('sku-1');
  expect(ownCart).toHaveLength(1);
});

test('THE FIX — the next test gets a clean one', async ({ ownCart }) => {
  expect(ownCart).toHaveLength(0);
});
