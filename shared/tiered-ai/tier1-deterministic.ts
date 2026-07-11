import type { Page } from '@playwright/test';
import { parseAriaSnapshot, type AriaNode } from './aria.js';

/**
 * Tier 1 — deterministic locator resolution (M11 lecture 11.B).
 *
 * Free and fast: walk `page.ariaSnapshot()`, score each role+name candidate
 * against the query by token overlap, and return the best role-based selector
 * with a confidence score — or null when nothing plausibly matches, which the
 * orchestrator treats as "fall through to tier 2."
 *
 * Results are cached per process, keyed by (page-signature, query). Per-process
 * caching means every CI shard starts cold — the conservative default discussed
 * in 11.F (cache poisoning). `_resetTier1Cache()` clears it between test runs.
 */

export type TierResult = {
  selector: string;
  confidence: number;
  tier: 1 | 2 | 3;
};

/** Below this, tier 1 reports "no plausible match" (null) rather than a weak guess. */
const MATCH_FLOOR = 0.34;

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'to',
  'of',
  'on',
  'in',
  'for',
  'and',
  'or',
  'that',
  'this',
  'with',
  'is',
]);

const cache = new Map<string, TierResult>();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

function signature(snapshot: string): string {
  let hash = 0;
  for (let i = 0; i < snapshot.length; i++) {
    hash = (hash * 31 + snapshot.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

function scoreNode(queryTokens: string[], node: AriaNode): number {
  if (queryTokens.length === 0) return 0;
  const nodeTokens = new Set(tokenize(`${node.role} ${node.name ?? ''}`));
  const matched = queryTokens.filter((t) => nodeTokens.has(t)).length;
  return matched / queryTokens.length;
}

function toSelector(node: AriaNode): string {
  return node.name ? `role=${node.role}[name="${node.name}"]` : `role=${node.role}`;
}

export async function tier1Locate(page: Page, query: string): Promise<TierResult | null> {
  const snapshot = await page.ariaSnapshot();
  const key = `${signature(snapshot)}::${query}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const queryTokens = tokenize(query);
  let best: AriaNode | null = null;
  let bestScore = 0;
  for (const node of parseAriaSnapshot(snapshot)) {
    const score = scoreNode(queryTokens, node);
    if (score > bestScore) {
      bestScore = score;
      best = node;
    }
  }

  if (!best || bestScore < MATCH_FLOOR) return null;

  const result: TierResult = { selector: toSelector(best), confidence: bestScore, tier: 1 };
  cache.set(key, result);
  return result;
}

/** Test-only — reset cache between runs to avoid cross-test contamination. */
export function _resetTier1Cache(): void {
  cache.clear();
}

export { MATCH_FLOOR };
