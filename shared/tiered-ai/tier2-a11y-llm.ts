import type { Page } from '@playwright/test';
import type { TierResult } from './tier1-deterministic.js';

/**
 * Tier 2 — a11y tree + LLM resolver.
 *
 * Referenced in M11 lecture 11.C. The full implementation makes a call to
 * Anthropic's Claude API with a compressed accessibility-tree snapshot. To
 * keep the main branch importable without requiring the @anthropic-ai/sdk
 * dependency on every install, this module is a typed stub. The working
 * implementation ships on the `m11-tiered-model` branch.
 *
 * Behavior when called without ANTHROPIC_API_KEY: returns null silently so
 * the tiered orchestrator falls through to tier 3 (or fails if tier 3 is
 * also unavailable).
 */

const CONFIDENCE_THRESHOLD = 0.7;

export async function tier2Locate(_page: Page, _query: string): Promise<TierResult | null> {
  // Working implementation in the m11-tiered-model branch.
  // For main, we silently return null so callers fall through.
  return null;
}

export { CONFIDENCE_THRESHOLD };
