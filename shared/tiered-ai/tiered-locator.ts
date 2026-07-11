import type { Page } from '@playwright/test';
import { tier1Locate } from './tier1-deterministic.js';
import { tier2Locate } from './tier2-a11y-llm.js';
import { tier3Locate, clickVisionTarget, type VisionLocation } from './tier3-vision.js';
import { breaker } from './circuit-breaker.js';

/**
 * Orchestrator across the three tiers.
 * Referenced in M11 lecture 11.E.
 */

export type TieredResult =
  | { kind: 'selector'; selector: string; confidence: number; tier: 1 | 2 }
  | { kind: 'coords'; location: VisionLocation }
  | { kind: 'fail'; reason: string };

export async function tieredLocate(page: Page, query: string): Promise<TieredResult> {
  if (process.env.OFFLINE_MODE === 'true') {
    const t1 = await tier1Locate(page, query);
    if (t1 && t1.confidence >= 0.85) {
      return { kind: 'selector', selector: t1.selector, confidence: t1.confidence, tier: 1 };
    }
    return { kind: 'fail', reason: 'OFFLINE_MODE — tier 1 only and no match' };
  }

  // Tier 1: always run; free; fast.
  const t1 = await tier1Locate(page, query);
  if (t1 && t1.confidence >= 0.85) {
    return { kind: 'selector', selector: t1.selector, confidence: t1.confidence, tier: 1 };
  }

  // Tier 2: gated by circuit breaker.
  if (breaker.allows('tier2')) {
    try {
      const t2 = await tier2Locate(page, query);
      if (t2) {
        breaker.recordSuccess('tier2');
        return { kind: 'selector', selector: t2.selector, confidence: t2.confidence, tier: 2 };
      }
    } catch (err) {
      breaker.recordFailure('tier2', err);
    }
  }

  // Tier 3: gated by circuit breaker.
  if (breaker.allows('tier3')) {
    try {
      const t3 = await tier3Locate(page, query);
      if (t3) {
        breaker.recordSuccess('tier3');
        return { kind: 'coords', location: t3 };
      }
    } catch (err) {
      breaker.recordFailure('tier3', err);
    }
  }

  return { kind: 'fail', reason: 'All tiers exhausted or breakers open' };
}

/**
 * Convenience: locate-and-click. For selector results, returns the locator.
 * For coordinate results, performs the click via mouse coordinates.
 */
export async function tieredClick(page: Page, query: string): Promise<void> {
  const result = await tieredLocate(page, query);
  if (result.kind === 'fail') {
    throw new Error(`tieredClick failed: ${result.reason}`);
  }
  if (result.kind === 'selector') {
    await page.locator(result.selector).click();
    return;
  }
  await clickVisionTarget(page, result.location);
}
