import type { JudgeVerdict } from './types.js';

/**
 * Reduce N judge verdicts to a pass-rate. Non-determinism is handled
 * statistically: report pass-rate over N, never a single pass/fail.
 * Referenced in M20 lecture 20.F.
 */
export function passRateOverN(verdicts: readonly JudgeVerdict[]): {
  passRate: number;
  n: number;
} {
  const n = verdicts.length;
  if (n === 0) return { passRate: 0, n: 0 };
  const passed = verdicts.filter((v) => v.passed).length;
  return { passRate: passed / n, n };
}
