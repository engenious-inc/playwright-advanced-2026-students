import { test, expect } from '@playwright/test';

/**
 * 2.F failure mode 3 — "setup-projects timing."
 *
 * `dependencies: ['setup']` guarantees the setup project RAN. It does not guarantee it achieved
 * anything. A setup that throws fails loudly and you fix it. A setup that half-succeeds — wrote
 * the auth file but the token inside it is empty, seeded two of three records, logged in as the
 * wrong user — hands every dependent test a broken world and no signal.
 *
 * What you get is a browser test failing on "expected 3 items, found 0", which reads like a bug in
 * the feature. You go and debug the feature. The feature is fine.
 *
 * The rule from the lecture: assert specific post-setup state in the FIRST test of every project
 * that depends on setup. If setup did not really finish, fail immediately, with a message that
 * names setup rather than the feature.
 *
 * (Same shape as 15.I's stale-storageState failure: when a dependency can silently half-succeed,
 * assert the thing that proves it fully succeeded.)
 */

type World = { token: string; seededItems: string[] };

/** A setup that "succeeds" — it returns, it throws nothing — while producing a broken world. */
function runHalfSucceededSetup(): World {
  return { token: '', seededItems: [] };
}

function runGoodSetup(): World {
  return { token: 'live-token', seededItems: ['a', 'b', 'c'] };
}

/** The check that belongs in the first test of every dependent project. */
function assertSetupCompleted(world: World) {
  expect(world.token, 'setup produced an empty auth token — setup did not complete').not.toBe('');
  expect(
    world.seededItems.length,
    'setup seeded no items — setup did not complete',
  ).toBeGreaterThan(0);
}

test('THE FAILURE — the feature test blames the feature for a setup problem', async () => {
  const world = runHalfSucceededSetup();

  // No setup assertion. The dependent test goes straight at the feature and reports this:
  //   expected 3 items, found 0
  // Nothing in that message points at setup, so that is not where anyone looks first.
  expect(world.seededItems).toHaveLength(0);
});

test('THE FIX — assert post-setup state first, and fail naming setup', async () => {
  const world = runHalfSucceededSetup();

  // Fails immediately with "setup seeded no items — setup did not complete". Same broken world,
  // an hour or two of debugging saved.
  expect(() => assertSetupCompleted(world)).toThrow(/setup did not complete/);
});

test('THE FIX — a real setup passes the same gate, so it is not just always-red', async () => {
  const world = runGoodSetup();
  assertSetupCompleted(world);
  expect(world.seededItems).toHaveLength(3);
});
