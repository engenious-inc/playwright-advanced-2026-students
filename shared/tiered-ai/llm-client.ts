import Anthropic from '@anthropic-ai/sdk';

/**
 * The slice of the Anthropic Messages API that tiers 2 and 3 use.
 *
 * Factored out of the lesson snippets (11.C / 11.D construct `new Anthropic(...)`
 * inline) so the tiers depend on this narrow interface, not the whole SDK — which
 * lets the escalation specs inject a deterministic fake instead of making real,
 * paid API calls. The real client is still built from `ANTHROPIC_API_KEY`.
 */
export type LlmResponse = { content: Array<{ type: string; text?: string }> };

export type LlmClient = {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<LlmResponse>;
  };
};

let override: LlmClient | null | undefined;

/**
 * Returns the shared client, or `null` when no API key is configured (the tiers
 * degrade silently to the next tier). A test override takes precedence — pass
 * `null` to simulate "no key", a fake to drive escalation, `undefined` to reset.
 */
export function getLlmClient(): LlmClient | null {
  if (override !== undefined) return override;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const anthropic = new Anthropic({ apiKey });
  return {
    messages: {
      create: (params) => anthropic.messages.create(params),
    },
  };
}

/** Test-only seam. `undefined` restores the env-based default. */
export function __setLlmClientForTest(client: LlmClient | null | undefined): void {
  override = client;
}
