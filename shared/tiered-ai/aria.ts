/**
 * Helpers for working with `page.ariaSnapshot()` output.
 *
 * `ariaSnapshot()` returns an indented YAML-ish tree, e.g.:
 *
 *   - banner:
 *     - link "Home"
 *   - main:
 *     - button "Submit"
 *     - textbox "Email"
 *
 * Two consumers in the tiered model:
 *  - Tier 1 (deterministic) parses it into role+name candidates to score.
 *  - Tier 2 (a11y-LLM) compresses it before sending to the model (11.C).
 */

export type AriaNode = {
  depth: number;
  role: string;
  name: string | null;
};

const LINE = /^(\s*)-\s+(.*)$/;
const ROLE_AND_NAME = /^([^\s":[]+)(?:\s+"((?:[^"\\]|\\.)*)")?/;

/**
 * Parse an ariaSnapshot string into a flat list of element nodes.
 * Property lines (`- /url: /`) and blank lines are skipped.
 */
export function parseAriaSnapshot(snapshot: string): AriaNode[] {
  const nodes: AriaNode[] = [];
  for (const raw of snapshot.split('\n')) {
    const line = LINE.exec(raw);
    if (!line) continue;
    const indent = (line[1] ?? '').length;
    const body = line[2] ?? '';
    if (body.startsWith('/')) continue; // property line, not an element
    const match = ROLE_AND_NAME.exec(body);
    if (!match) continue;
    const role = match[1] ?? '';
    if (!role) continue;
    const rawName = match[2];
    const name = rawName !== undefined ? rawName.replace(/\\"/g, '"') : null;
    nodes.push({ depth: Math.floor(indent / 2), role, name });
  }
  return nodes;
}

const DECORATIVE_ROLES = new Set(['generic', 'presentation', 'none']);
const MAX_DEPTH = 8;

/**
 * Prune an ariaSnapshot before sending it to the LLM (11.C):
 *  1. decorative/wrapper roles (generic/presentation/none) with no name,
 *  2. nodes deeper than {@link MAX_DEPTH} levels.
 * Keeps the original line text for retained nodes so the model sees real markup.
 */
export function compressSnapshot(snapshot: string): string {
  const kept: string[] = [];
  for (const raw of snapshot.split('\n')) {
    const line = LINE.exec(raw);
    if (!line) continue;
    const depth = Math.floor((line[1] ?? '').length / 2);
    if (depth > MAX_DEPTH) continue;
    const body = line[2] ?? '';
    const match = ROLE_AND_NAME.exec(body);
    const role = match?.[1] ?? '';
    const hasName = match?.[2] !== undefined;
    if (DECORATIVE_ROLES.has(role) && !hasName) continue;
    kept.push(raw);
  }
  return kept.join('\n');
}

export { DECORATIVE_ROLES, MAX_DEPTH };
