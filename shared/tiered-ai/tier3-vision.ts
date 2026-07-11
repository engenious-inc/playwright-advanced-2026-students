import type { Page } from '@playwright/test';
import { getLlmClient } from './llm-client.js';
import { parseVisionResponse } from './parse.js';

/**
 * Tier 3 — vision model on a screenshot (M11 lecture 11.D).
 *
 * The last resort: for surfaces with no usable a11y signal (canvas video
 * players, ad overlays), screenshot the page and ask a vision-capable Claude
 * model for the target's pixel bounding box. Uses Opus — the most cognitively
 * demanding tier — and costs ~5-10× tier 2, so the orchestrator only reaches it
 * after tiers 1 and 2 miss.
 *
 * Returns null when there is no API key or confidence is below
 * {@link CONFIDENCE_THRESHOLD}. `clickVisionTarget` clicks the box center; pair
 * it with a downstream assertion (11.F) since vision can misclick.
 */

const CONFIDENCE_THRESHOLD = 0.7;
const MODEL = 'claude-opus-4-8';

export type VisionLocation = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  tier: 3;
};

export async function tier3Locate(page: Page, query: string): Promise<VisionLocation | null> {
  const client = getLlmClient();
  if (!client) return null;

  const screenshot = await page.screenshot({ type: 'png', fullPage: false });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshot.toString('base64'),
            },
          },
          {
            type: 'text',
            text: `Find the single element that best matches the query and return its
bounding box in pixel coordinates.

QUERY: "${query}"

Respond ONLY with a JSON object:
{ "x": int, "y": int, "width": int, "height": int, "confidence": 0.0-1.0 }
The (x, y) is the top-left of the bounding box.
If you cannot identify a match with confidence >= ${CONFIDENCE_THRESHOLD}, respond with
{ "x": 0, "y": 0, "width": 0, "height": 0, "confidence": 0.0 }.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? (response.content[0].text ?? '') : '';
  const parsed = parseVisionResponse(text);

  if (!parsed || parsed.confidence < CONFIDENCE_THRESHOLD) return null;

  return { ...parsed, tier: 3 };
}

export async function clickVisionTarget(page: Page, target: VisionLocation): Promise<void> {
  const x = target.x + Math.floor(target.width / 2);
  const y = target.y + Math.floor(target.height / 2);
  await page.mouse.click(x, y);
}

export { CONFIDENCE_THRESHOLD, MODEL };
