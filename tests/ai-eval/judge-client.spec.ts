import { test, expect } from '@playwright/test';
import { JudgeClient } from '../../shared/ai-eval/judge-client.js';
import { CostMeter } from '../../shared/ai-eval/index.js';
import { passRateOverN } from '../../shared/ai-eval/index.js';
import type { Rubric, JudgeVerdict } from '../../shared/ai-eval/index.js';
import type { JudgeLlmClient, JudgeLlmResponse } from '../../shared/ai-eval/llm-client.js';

/**
 * M20 — LLM-as-judge, driven by a deterministic fake so the suite runs without
 * an API key or network (20.C). The judge's non-determinism is handled by
 * callers via passRateOverN — see the final test.
 */

const RUBRIC: Rubric = {
  id: 'support-reply',
  version: '1.0.0',
  criteria: [
    { id: 'addresses_question', description: 'Answers the user question', weight: 0.5 },
    { id: 'grounded', description: 'Stays grounded in provided context', weight: 0.3 },
    { id: 'no_invention', description: 'Invents no facts', weight: 0.2 },
  ],
};

type Reply = {
  scores: Record<string, number>;
  rationale?: string;
  usage?: JudgeLlmResponse['usage'];
};

function fakeClient(replies: Reply[]): JudgeLlmClient {
  let i = 0;
  return {
    messages: {
      create: () => {
        const reply = replies[Math.min(i, replies.length - 1)] ?? { scores: {} };
        i += 1;
        return Promise.resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ scores: reply.scores, rationale: reply.rationale ?? 'ok' }),
            },
          ],
          usage: reply.usage,
        });
      },
    },
  };
}

test('passes when the weighted score meets the threshold', async () => {
  const judge = new JudgeClient({
    client: fakeClient([
      { scores: { addresses_question: 1, grounded: 1, no_invention: 1 }, rationale: 'solid' },
    ]),
  });
  const verdict = await judge.judge('a good answer', RUBRIC);
  expect(verdict).toEqual({ passed: true, score: 1, rationale: 'solid' });
});

test('computes the weighted mean and fails below threshold', async () => {
  // addresses(0.5*1) + grounded(0.3*0) + no_invention(0.2*0) = 0.5 < 0.7
  const judge = new JudgeClient({
    client: fakeClient([{ scores: { addresses_question: 1, grounded: 0, no_invention: 0 } }]),
  });
  const verdict = await judge.judge('partial answer', RUBRIC);
  expect(verdict.score).toBeCloseTo(0.5, 5);
  expect(verdict.passed).toBe(false);
});

test('a missing criterion score counts as zero', async () => {
  // only addresses_question present → 0.5 weight → 0.5 total
  const judge = new JudgeClient({ client: fakeClient([{ scores: { addresses_question: 1 } }]) });
  const verdict = await judge.judge('x', RUBRIC);
  expect(verdict.score).toBeCloseTo(0.5, 5);
});

test('records token usage into the CostMeter when provided', async () => {
  const meter = new CostMeter();
  const judge = new JudgeClient({
    costMeter: meter,
    client: fakeClient([
      {
        scores: { addresses_question: 1, grounded: 1, no_invention: 1 },
        usage: { input_tokens: 120, output_tokens: 40 },
      },
    ]),
  });
  await judge.judge('x', RUBRIC);
  expect(meter.total()).toEqual({ tokensIn: 120, tokensOut: 40 });
});

test('throws with no client (simulated missing API key)', async () => {
  const judge = new JudgeClient({ client: null });
  await expect(judge.judge('x', RUBRIC)).rejects.toThrow(/ANTHROPIC_API_KEY|injected client/);
});

test('throws when the model reply has no parseable verdict', async () => {
  const noJson: JudgeLlmClient = {
    messages: { create: () => Promise.resolve({ content: [{ type: 'text', text: 'sorry, no' }] }) },
  };
  const judge = new JudgeClient({ client: noJson });
  await expect(judge.judge('x', RUBRIC)).rejects.toThrow(/could not parse/);
});

test('N runs reduce to a pass-rate (non-determinism handled statistically)', async () => {
  const judge = new JudgeClient({
    client: fakeClient([
      { scores: { addresses_question: 1, grounded: 1, no_invention: 1 } }, // pass
      { scores: { addresses_question: 1, grounded: 0, no_invention: 0 } }, // fail (0.5)
      { scores: { addresses_question: 1, grounded: 1, no_invention: 1 } }, // pass
    ]),
  });
  const verdicts: JudgeVerdict[] = [];
  verdicts.push(await judge.judge('a', RUBRIC));
  verdicts.push(await judge.judge('b', RUBRIC));
  verdicts.push(await judge.judge('c', RUBRIC));
  const { passRate, n } = passRateOverN(verdicts);
  expect(n).toBe(3);
  expect(passRate).toBeCloseTo(2 / 3, 5);
});
