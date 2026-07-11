import Anthropic from '@anthropic-ai/sdk';

/**
 * Narrow slice of the Anthropic Messages API the LLM-judge uses (20.C).
 * Factored out so `JudgeClient` depends on this interface, not the whole SDK —
 * which lets the judge specs inject a deterministic fake instead of making real,
 * paid API calls. `usage` is surfaced so a `CostMeter` can track spend (20.F).
 */
export type JudgeLlmResponse = {
  content: Array<{ type: string; text?: string }>;
  usage?: { input_tokens: number; output_tokens: number };
};

export type JudgeLlmClient = {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<JudgeLlmResponse>;
  };
};

/** Build the real env-backed client, or `null` when no API key is configured. */
export function envJudgeClient(): JudgeLlmClient | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const anthropic = new Anthropic({ apiKey });
  return {
    messages: {
      create: (params) => anthropic.messages.create(params),
    },
  };
}
