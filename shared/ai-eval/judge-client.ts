import type { JudgeVerdict, Rubric } from './types.js';
import type { CostMeter } from './cost-meter.js';
import { envJudgeClient, type JudgeLlmClient } from './llm-client.js';

/**
 * LLM-as-judge client (M20 lecture 20.C).
 *
 * Hands an output plus a rubric to an evaluator model, asks it to score each
 * criterion 0..1 with a rationale, then reduces to a weighted score and a
 * pass/fail against a threshold. The judge is itself non-deterministic — never
 * trust one run; call it N times and reduce with `passRateOverN` (20.F).
 *
 * The provider call is injectable (see `JudgeLlmClient`) so specs run against a
 * deterministic fake without spending money; the default client is built from
 * `ANTHROPIC_API_KEY`. `main` keeps this stubbed — the live impl is this file on
 * the `m20-testing-ai` branch.
 */

const DEFAULT_MODEL = 'claude-sonnet-4-6'; // 20.C ⏱ — re-verify before recording
const DEFAULT_THRESHOLD = 0.7;
const MAX_TOKENS = 500;

export type JudgeOptions = {
  // undefined → build from ANTHROPIC_API_KEY; null → no client (simulates no key).
  client?: JudgeLlmClient | null;
  model?: string;
  threshold?: number;
  costMeter?: CostMeter;
};

type JudgeResponse = { scores: Record<string, number>; rationale: string };

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function parseJudgeResponse(text: string): JudgeResponse | null {
  const parsed = extractJson(text);
  if (typeof parsed !== 'object' || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  const rawScores = record.scores;
  const rationale = typeof record.rationale === 'string' ? record.rationale : '';
  if (typeof rawScores !== 'object' || rawScores === null) return null;
  const scores: Record<string, number> = {};
  for (const [id, value] of Object.entries(rawScores)) {
    if (typeof value === 'number') scores[id] = value;
  }
  return { scores, rationale };
}

/** Weighted mean of per-criterion scores; missing/invalid scores count as 0. */
function weightedScore(rubric: Rubric, scores: Record<string, number>): number {
  const totalWeight = rubric.criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;
  const earned = rubric.criteria.reduce((sum, c) => {
    const raw = scores[c.id] ?? 0;
    const clamped = Math.max(0, Math.min(1, raw));
    return sum + c.weight * clamped;
  }, 0);
  return earned / totalWeight;
}

function buildPrompt(output: string, rubric: Rubric): string {
  const criteria = rubric.criteria
    .map((c) => `- ${c.id} (weight ${c.weight}): ${c.description}`)
    .join('\n');
  return `You are an impartial evaluator. Score the OUTPUT against each CRITERION
from 0.0 (fails the criterion) to 1.0 (fully meets it). Be specific and, where a
criterion is yes/no, use 0.0 or 1.0.

CRITERIA:
${criteria}

OUTPUT:
"""
${output}
"""

Respond ONLY with a JSON object:
{ "scores": { ${rubric.criteria.map((c) => `"${c.id}": 0.0-1.0`).join(', ')} }, "rationale": "one or two sentences" }`;
}

export class JudgeClient {
  private readonly client: JudgeLlmClient | null;
  private readonly model: string;
  private readonly threshold: number;
  private readonly costMeter: CostMeter | undefined;

  constructor(options: JudgeOptions = {}) {
    this.client = options.client === undefined ? envJudgeClient() : options.client;
    this.model = options.model ?? DEFAULT_MODEL;
    this.threshold = options.threshold ?? DEFAULT_THRESHOLD;
    this.costMeter = options.costMeter;
  }

  async judge(output: string, rubric: Rubric): Promise<JudgeVerdict> {
    if (!this.client) {
      throw new Error('JudgeClient needs ANTHROPIC_API_KEY (or an injected client) to evaluate');
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: buildPrompt(output, rubric) }],
    });

    if (this.costMeter && response.usage) {
      this.costMeter.record(response.usage.input_tokens, response.usage.output_tokens);
    }

    const text = response.content[0]?.type === 'text' ? (response.content[0].text ?? '') : '';
    const parsed = parseJudgeResponse(text);
    if (!parsed) {
      throw new Error('JudgeClient could not parse a scored verdict from the model response');
    }

    const score = weightedScore(rubric, parsed.scores);
    return { passed: score >= this.threshold, score, rationale: parsed.rationale };
  }
}

export { DEFAULT_MODEL, DEFAULT_THRESHOLD };
