import type { JudgeVerdict, Rubric } from './types.js';

/**
 * LLM-as-judge client. Stubbed on main — the live provider call lands on the
 * m20-testing-ai branch so default CI never spends money. Referenced in 20.C.
 */
export class JudgeClient {
  async judge(output: string, rubric: Rubric): Promise<JudgeVerdict> {
    void output;
    void rubric;
    throw new Error('JudgeClient.judge is stubbed on main; implement on the m20-testing-ai branch');
  }
}
