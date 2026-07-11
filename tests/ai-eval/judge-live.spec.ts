import { test, expect } from '@playwright/test';
import { JudgeClient } from '../../shared/ai-eval/judge-client.js';
import type { Rubric } from '../../shared/ai-eval/index.js';

/**
 * M20 — live LLM-as-judge smoke against the real Anthropic API (20.C).
 * Opt-in (spends money): run with `M20_LIVE=1 ANTHROPIC_API_KEY=sk-... npm test`.
 * Gated on an explicit flag, not just key presence, so a stale env key doesn't
 * fire it. Per 20.C, one run isn't trustworthy — this is a smoke, not a gate.
 */
test.describe('M20 judge (live)', () => {
  test.skip(
    process.env.M20_LIVE !== '1' || !process.env.ANTHROPIC_API_KEY,
    'set M20_LIVE=1 and a valid ANTHROPIC_API_KEY to run',
  );

  const RUBRIC: Rubric = {
    id: 'faithful-summary',
    version: '1.0.0',
    criteria: [
      { id: 'faithful', description: 'The summary is faithful to the source', weight: 0.7 },
      { id: 'concise', description: 'The summary is concise', weight: 0.3 },
    ],
  };

  test('a clearly-faithful summary scores above threshold', async () => {
    const judge = new JudgeClient();
    const verdict = await judge.judge(
      'Source: The cat sat on the mat. Summary: A cat was on a mat.',
      RUBRIC,
    );
    expect(verdict.score).toBeGreaterThanOrEqual(0.7);
    expect(verdict.passed).toBe(true);
  });
});
