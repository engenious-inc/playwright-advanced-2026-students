/**
 * Parse the JSON object an LLM returns for tier 2 (selector) and tier 3 (bbox).
 * Models sometimes wrap JSON in prose or code fences, so we extract the first
 * balanced `{...}` span rather than JSON.parsing the whole reply. Malformed or
 * off-shape replies return `null` — the caller treats that as a tier miss.
 */

function extractFirstJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type SelectorAnswer = { selector: string | null; confidence: number };

export function parseSelectorResponse(text: string): SelectorAnswer | null {
  const parsed = extractFirstJsonObject(text);
  if (!isRecord(parsed)) return null;
  const { selector, confidence } = parsed;
  if (typeof confidence !== 'number') return null;
  if (selector !== null && typeof selector !== 'string') return null;
  return { selector, confidence };
}

export type BoxAnswer = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

export function parseVisionResponse(text: string): BoxAnswer | null {
  const parsed = extractFirstJsonObject(text);
  if (!isRecord(parsed)) return null;
  const { x, y, width, height, confidence } = parsed;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof confidence !== 'number'
  ) {
    return null;
  }
  return { x, y, width, height, confidence };
}
