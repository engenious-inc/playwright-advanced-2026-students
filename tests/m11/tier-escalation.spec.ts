import { test, expect } from '@playwright/test';
import { tieredLocate } from '../../shared/tiered-ai/tiered-locator.js';
import { _resetTier1Cache } from '../../shared/tiered-ai/tier1-deterministic.js';
import { breaker } from '../../shared/tiered-ai/circuit-breaker.js';
import {
  __setLlmClientForTest,
  type LlmClient,
  type LlmResponse,
} from '../../shared/tiered-ai/llm-client.js';

/**
 * M11 — full tier-1/2/3 escalation, driven by a deterministic fake LLM client
 * so the suite runs without an API key or network. The homework (11.F) predicts
 * which tier handles which query; these specs pin that escalation contract.
 *
 * A fake distinguishes tier 2 (text-only message) from tier 3 (message with an
 * image block) and returns the answer each tier expects.
 */

type Answers = { tier2?: object; tier3?: object };

function jsonResponse(payload: object): LlmResponse {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
}

function fakeClient(answers: Answers, onCall?: (tier: 2 | 3) => void): LlmClient {
  return {
    messages: {
      create: (params) => {
        const isVision = Array.isArray(params.messages[0]?.content);
        const tier = isVision ? 3 : 2;
        onCall?.(tier);
        const payload = isVision ? answers.tier3 : answers.tier2;
        if (!payload) throw new Error(`fake tier ${tier} error`);
        return Promise.resolve(jsonResponse(payload));
      },
    },
  };
}

const MISS_QUERY = 'please dispatch the paperwork'; // no token overlap with the button

test.describe('M11 tier escalation', () => {
  test.beforeEach(() => {
    _resetTier1Cache();
    breaker.reset();
    delete process.env.OFFLINE_MODE;
  });

  test.afterEach(() => {
    __setLlmClientForTest(undefined);
    breaker.reset();
    _resetTier1Cache();
  });

  test('tier 1 miss escalates to a tier 2 selector', async ({ page }) => {
    await page.setContent('<main><button type="button">Submit</button></main>');
    __setLlmClientForTest(
      fakeClient({ tier2: { selector: 'role=button[name="Submit"]', confidence: 0.9 } }),
    );
    const result = await tieredLocate(page, MISS_QUERY);
    expect(result).toEqual({
      kind: 'selector',
      selector: 'role=button[name="Submit"]',
      confidence: 0.9,
      tier: 2,
    });
  });

  test('tier 2 low confidence escalates to a tier 3 bounding box', async ({ page }) => {
    await page.setContent('<main><button type="button">Submit</button></main>');
    __setLlmClientForTest(
      fakeClient({
        tier2: { selector: null, confidence: 0.0 },
        tier3: { x: 10, y: 20, width: 30, height: 40, confidence: 0.91 },
      }),
    );
    const result = await tieredLocate(page, MISS_QUERY);
    expect(result).toEqual({
      kind: 'coords',
      location: { x: 10, y: 20, width: 30, height: 40, confidence: 0.91, tier: 3 },
    });
  });

  test('all tiers miss returns a fail result', async ({ page }) => {
    await page.setContent('<main><button type="button">Submit</button></main>');
    __setLlmClientForTest(
      fakeClient({
        tier2: { selector: null, confidence: 0.0 },
        tier3: { x: 0, y: 0, width: 0, height: 0, confidence: 0.0 },
      }),
    );
    const result = await tieredLocate(page, MISS_QUERY);
    expect(result).toEqual({ kind: 'fail', reason: 'All tiers exhausted or breakers open' });
  });

  test('an open tier-2 breaker skips tier 2 and escalates straight to tier 3', async ({ page }) => {
    await page.setContent('<main><button type="button">Submit</button></main>');
    breaker.recordFailure('tier2', new Error('x'));
    breaker.recordFailure('tier2', new Error('x'));
    breaker.recordFailure('tier2', new Error('x'));
    expect(breaker.isOpen('tier2')).toBe(true);

    const calledTiers: number[] = [];
    __setLlmClientForTest(
      fakeClient(
        {
          tier2: { selector: 'role=button[name="Submit"]', confidence: 0.99 },
          tier3: { x: 1, y: 2, width: 3, height: 4, confidence: 0.9 },
        },
        (tier) => calledTiers.push(tier),
      ),
    );
    const result = await tieredLocate(page, MISS_QUERY);
    expect(calledTiers).not.toContain(2); // tier 2 was never called — breaker open
    expect(result.kind).toBe('coords');
  });

  test('no API key: tiers 2 and 3 unavailable, escalation fails', async ({ page }) => {
    await page.setContent('<main><button type="button">Submit</button></main>');
    __setLlmClientForTest(null); // simulate missing ANTHROPIC_API_KEY
    const result = await tieredLocate(page, MISS_QUERY);
    expect(result).toEqual({ kind: 'fail', reason: 'All tiers exhausted or breakers open' });
  });
});
