import { test, expect } from '@playwright/test';

/**
 * 10.G failure mode 3 — "tool name collisions."
 *
 * An LLM addresses tools by NAME. Connect two MCP servers that both expose `search`, or
 * `get_status`, or `run_query`, and the model has one name pointing at two different
 * implementations with different arguments and different blast radii.
 *
 * Nothing errors. Registries are usually a map, so the second registration silently overwrites the
 * first, and every call the model believed was going to server A now lands on server B. The model
 * cannot detect this: it sees one tool, gets a plausible response, and carries on.
 *
 * It is worse than a broken tool, because a broken tool fails visibly. This one succeeds at the
 * wrong thing — and the tool that lost the race is the one you were relying on.
 *
 * Fix: namespace tools by server, and make registration collide loudly rather than overwrite.
 * A registry that throws on duplicate names turns a silent production misroute into a startup
 * error you fix once.
 */

type Tool = { name: string; server: string; run: () => string };

const analytics: Tool = { name: 'search', server: 'analytics', run: () => 'rows from warehouse' };
const filesystem: Tool = { name: 'search', server: 'filesystem', run: () => 'paths on disk' };

/** The naive registry: a plain map, last write wins. */
function registerNaive(tools: Tool[]): Map<string, Tool> {
  const registry = new Map<string, Tool>();
  for (const tool of tools) registry.set(tool.name, tool);
  return registry;
}

/** The fixed registry: namespaced, and duplicates are a startup error. */
function registerNamespaced(tools: Tool[]): Map<string, Tool> {
  const registry = new Map<string, Tool>();
  for (const tool of tools) {
    const key = `${tool.server}.${tool.name}`;
    if (registry.has(key)) throw new Error(`duplicate tool registration: ${key}`);
    registry.set(key, tool);
  }
  return registry;
}

test('THE FAILURE — the second server silently wins the name', async () => {
  const registry = registerNaive([analytics, filesystem]);

  // One name, one entry. The analytics tool is simply gone.
  expect(registry.size).toBe(1);

  // The model asks for "search" intending the warehouse and gets the filesystem. No error, a
  // plausible-looking response, and an answer built on the wrong data source.
  expect(registry.get('search')?.server).toBe('filesystem');
  expect(registry.get('search')?.run()).toBe('paths on disk');
});

test('THE FIX — namespacing keeps both, and real duplicates fail loudly', async () => {
  const registry = registerNamespaced([analytics, filesystem]);

  expect(registry.size).toBe(2);
  expect(registry.get('analytics.search')?.run()).toBe('rows from warehouse');
  expect(registry.get('filesystem.search')?.run()).toBe('paths on disk');

  // A genuine duplicate is now a startup error, not a production misroute.
  expect(() => registerNamespaced([analytics, analytics])).toThrow(/duplicate tool registration/);
});
