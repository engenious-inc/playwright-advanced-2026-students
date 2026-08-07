import { test, expect } from '@playwright/test';

/**
 * 9.F failure mode 1 — "AGENTS.md drifts away from reality."
 *
 * Instruction files are prose. Lint config is executable. Nothing keeps them in step, so they
 * drift in both directions — and each direction fails differently:
 *
 *   Doc promises what lint does not enforce   -> the agent is told a rule that nothing catches.
 *                                                Violations reach review, where a human is the
 *                                                only backstop.
 *   Lint enforces what the doc never mentions -> the agent generates the banned pattern, hits
 *                                                lint, regenerates, hits it again. You pay for
 *                                                inference to rediscover a rule you already knew.
 *
 * The second one is the expensive surprise: nothing is broken, nothing is red, and you are simply
 * burning tokens in a loop that a single documented line would end.
 *
 * Fix: make the pair checkable. A test that cross-references the two files turns "we should keep
 * these in sync" into something CI can fail on — which is 9.D's lint-safety-net idea applied to
 * the instructions themselves.
 */

/** Rules the instruction file tells the agent to follow. */
const AGENTS_MD = `
# Testing rules
- Never use waitForTimeout; use web-first assertions.
- Never put conditionals in a test body.
`;

/** Rules the lint config actually enforces. */
const ESLINT_RULES = [
  'playwright/no-wait-for-timeout',
  'playwright/no-conditional-in-test',
  // Enforced, but never written down. The agent does not know about it.
  'playwright/prefer-web-first-assertions',
  '@typescript-eslint/no-floating-promises',
];

/** Maps a documented rule to the lint rule that enforces it. */
const DOC_TO_RULE: ReadonlyMap<RegExp, string> = new Map([
  [/waitForTimeout/i, 'playwright/no-wait-for-timeout'],
  [/conditionals? in a test/i, 'playwright/no-conditional-in-test'],
  [/web-first assertions/i, 'playwright/prefer-web-first-assertions'],
  [/floating promises/i, '@typescript-eslint/no-floating-promises'],
]);

function documentedRules(doc: string): string[] {
  return [...DOC_TO_RULE].filter(([pattern]) => pattern.test(doc)).map(([, rule]) => rule);
}

test('THE DRIFT — lint enforces rules the instruction file never mentions', async () => {
  const documented = documentedRules(AGENTS_MD);
  const undocumented = ESLINT_RULES.filter((r) => !documented.includes(r));

  // `no-floating-promises` is enforced and undocumented. The agent will keep generating floating
  // promises, keep hitting lint, and keep regenerating — paying for inference each round.
  expect(undocumented).toContain('@typescript-eslint/no-floating-promises');
});

test('THE FIX — a test that fails when the two drift apart', async () => {
  const gap = (doc: string) => ESLINT_RULES.filter((r) => !documentedRules(doc).includes(r));

  // As written today, the pair is out of step and this check reports it.
  expect(gap(AGENTS_MD).length).toBeGreaterThan(0);

  // Document the missing rule and the same check goes green — no other change required.
  const updated = `${AGENTS_MD}- Never leave floating promises; await every async call.\n`;
  expect(gap(updated)).toHaveLength(0);
});
