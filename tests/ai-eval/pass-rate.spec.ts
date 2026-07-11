import { test, expect } from '@playwright/test';
import { passRateOverN } from '../../shared/ai-eval/index.js';
import type { JudgeVerdict } from '../../shared/ai-eval/index.js';

const verdict = (passed: boolean): JudgeVerdict => ({
  passed,
  score: passed ? 1 : 0,
  rationale: 'fixture',
});

test('passRateOverN computes proportion passed over N runs', () => {
  const verdicts = [verdict(true), verdict(true), verdict(false), verdict(true)];
  const result = passRateOverN(verdicts);
  expect(result.n).toBe(4);
  expect(result.passRate).toBeCloseTo(0.75, 5);
});

test('passRateOverN reports 0 over an empty set without dividing by zero', () => {
  const result = passRateOverN([]);
  expect(result.n).toBe(0);
  expect(result.passRate).toBe(0);
});
