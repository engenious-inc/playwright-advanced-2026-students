import { test, expect } from '@playwright/test';
import { passRateOverN } from '../../shared/ai-eval/pass-rate.js';
import { CostMeter } from '../../shared/ai-eval/cost-meter.js';
import { loadRubric } from '../../shared/ai-eval/rubric-loader.js';
import { JudgeClient } from '../../shared/ai-eval/judge-client.js';
import type { JudgeVerdict } from '../../shared/ai-eval/types.js';

/**
 * M20 — code-backed parity for the finale (IMPROVEMENT-PLAN P3.4).
 *
 * The AI-eval tier splits into a DETERMINISTIC layer (pass-rate math, cost budget,
 * rubric validation) that needs no model + a live JUDGE (stubbed on main; real impl on
 * the m20-testing-ai branch). These specs cover the deterministic layer — exactly the
 * "cheap thing first, and it's free" point 20.B makes — so the finale ships with runnable
 * tests, not just typed stubs. No API key, no spend.
 */

const verdict = (passed: boolean, score: number): JudgeVerdict => ({
  passed,
  score,
  rationale: 'test',
});

test.describe('M20 ai-eval — deterministic layer', () => {
  test.describe('passRateOverN', () => {
    test('empty verdict set is 0/0, not NaN', () => {
      expect(passRateOverN([])).toEqual({ passRate: 0, n: 0 });
    });

    test('reports the fraction passed over N, not a single pass/fail', () => {
      const verdicts = [
        verdict(true, 0.9),
        verdict(false, 0.2),
        verdict(true, 0.8),
        verdict(true, 0.7),
      ];
      expect(passRateOverN(verdicts)).toEqual({ passRate: 0.75, n: 4 });
    });

    test('all-pass is 1 and all-fail is 0', () => {
      expect(passRateOverN([verdict(true, 1), verdict(true, 1)]).passRate).toBe(1);
      expect(passRateOverN([verdict(false, 0), verdict(false, 0)]).passRate).toBe(0);
    });
  });

  test.describe('CostMeter', () => {
    test('accumulates token spend across judge calls', () => {
      const meter = new CostMeter();
      meter.record(100, 20);
      meter.record(50, 10);
      expect(meter.total()).toEqual({ tokensIn: 150, tokensOut: 30 });
    });

    test('a fresh meter reads zero', () => {
      expect(new CostMeter().total()).toEqual({ tokensIn: 0, tokensOut: 0 });
    });
  });

  test.describe('loadRubric', () => {
    const validRubric = {
      id: 'support-reply',
      version: '2026.1',
      criteria: [{ id: 'helpful', description: 'answers the question', weight: 1 }],
    };

    test('parses a well-formed rubric', () => {
      expect(loadRubric(validRubric)).toEqual(validRubric);
    });

    test('rejects a rubric with no criteria (empty array)', () => {
      expect(() => loadRubric({ ...validRubric, criteria: [] })).toThrow();
    });

    test('rejects a criterion weight outside 0..1', () => {
      const bad = { ...validRubric, criteria: [{ id: 'x', description: 'y', weight: 1.5 }] };
      expect(() => loadRubric(bad)).toThrow();
    });

    test('rejects a non-object payload', () => {
      expect(() => loadRubric('not a rubric')).toThrow();
    });
  });

  test.describe('JudgeClient (stubbed on main)', () => {
    test('judge() throws on main — the live impl ships on m20-testing-ai', async () => {
      const client = new JudgeClient();
      await expect(client.judge('some output', loadRubric(validRubricFor()))).rejects.toThrow(
        /stubbed on main/,
      );
    });
  });
});

function validRubricFor() {
  return {
    id: 'support-reply',
    version: '2026.1',
    criteria: [{ id: 'helpful', description: 'answers the question', weight: 1 }],
  };
}
