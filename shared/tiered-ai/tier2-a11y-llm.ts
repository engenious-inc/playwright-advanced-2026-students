import type { Page } from '@playwright/test';
import type { TierResult } from './tier1-deterministic.js';
import { compressSnapshot } from './aria.js';
import { getLlmClient } from './llm-client.js';
import { parseSelectorResponse } from './parse.js';

/**
 * Tier 2 — a11y-tree + LLM resolver (M11 lecture 11.C).
 *
 * Sends a *compressed* accessibility tree plus the query to Claude and asks for
 * one role-based selector with a confidence score. No HTML, no CSS, no
 * screenshot — the a11y tree is the entire input contract. Production calls go
 * to Sonnet (fast/cheap/good-enough); Opus is reserved for tier 3 vision.
 *
 * Returns null (→ orchestrator falls through to tier 3) when there is no API
 * key, the model declines, or confidence is below {@link CONFIDENCE_THRESHOLD}.
 */

const CONFIDENCE_THRESHOLD = 0.7;
const MODEL = 'claude-sonnet-4-6';

export async function tier2Locate(page: Page, query: string): Promise<TierResult | null> {
  const client = getLlmClient();
  if (!client) return null; // no key — degrade silently to the next tier

  const compressed = compressSnapshot(await page.ariaSnapshot());

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Given this accessibility hierarchy from a web page, identify the single
element that best matches the query.

QUERY: "${query}"

ACCESSIBILITY TREE:
${compressed}

Respond ONLY with a JSON object: { "selector": "...", "confidence": 0.0-1.0 }
The selector must be a valid Playwright role-based selector.
If you cannot identify a match with confidence >= ${CONFIDENCE_THRESHOLD}, respond with
{ "selector": null, "confidence": 0.0 }.`,
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? (response.content[0].text ?? '') : '';
  const parsed = parseSelectorResponse(text);

  if (!parsed || !parsed.selector || parsed.confidence < CONFIDENCE_THRESHOLD) {
    return null;
  }

  return { selector: parsed.selector, confidence: parsed.confidence, tier: 2 };
}

export { CONFIDENCE_THRESHOLD, MODEL };
