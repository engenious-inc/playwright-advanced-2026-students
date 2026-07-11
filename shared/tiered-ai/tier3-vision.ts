import type { Page } from '@playwright/test';

/**
 * Tier 3 — vision-model resolver on screenshots.
 *
 * Referenced in M11 lecture 11.D. The full implementation makes a call to a
 * vision-capable Claude model with a page screenshot. Like tier 2, this is a
 * typed stub on main; the working implementation ships on the
 * `m11-tiered-model` branch.
 *
 * When the working implementation is unavailable (no API key, network off,
 * etc.), this stub returns null so callers fail explicitly rather than
 * silently mis-clicking.
 */

const CONFIDENCE_THRESHOLD = 0.7;

export type VisionLocation = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  tier: 3;
};

export async function tier3Locate(_page: Page, _query: string): Promise<VisionLocation | null> {
  return null;
}

export async function clickVisionTarget(page: Page, target: VisionLocation): Promise<void> {
  const x = target.x + Math.floor(target.width / 2);
  const y = target.y + Math.floor(target.height / 2);
  await page.mouse.click(x, y);
}

export { CONFIDENCE_THRESHOLD };
