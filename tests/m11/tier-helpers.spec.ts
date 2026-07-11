import { test, expect } from '@playwright/test';
import { compressSnapshot, parseAriaSnapshot } from '../../shared/tiered-ai/aria.js';
import { parseSelectorResponse, parseVisionResponse } from '../../shared/tiered-ai/parse.js';

/**
 * M11 — unit coverage for the tier helpers (no browser, no API).
 */
test.describe('aria snapshot helpers', () => {
  const SNAPSHOT = [
    '- main:',
    '  - generic:', // decorative, no name → pruned
    '    - button "Keep me"',
    '  - presentation:', // decorative → pruned
    '  - generic "Has a name":', // named generic → kept
    '  - link "Home"',
  ].join('\n');

  test('parseAriaSnapshot extracts role+name, skips property lines', () => {
    const nodes = parseAriaSnapshot('- main:\n  - link "Home"\n    - /url: /\n  - button "Go"');
    expect(nodes).toEqual([
      { depth: 0, role: 'main', name: null },
      { depth: 1, role: 'link', name: 'Home' },
      { depth: 1, role: 'button', name: 'Go' },
    ]);
  });

  test('compressSnapshot prunes decorative unnamed nodes, keeps named ones', () => {
    const out = compressSnapshot(SNAPSHOT).split('\n');
    expect(out).toContain('    - button "Keep me"');
    expect(out).toContain('  - generic "Has a name":');
    expect(out).toContain('  - link "Home"');
    expect(out).not.toContain('  - generic:');
    expect(out).not.toContain('  - presentation:');
  });

  test('compressSnapshot drops nodes deeper than 8 levels', () => {
    const line8 = `${'  '.repeat(8)}- button "Deep8"`; // depth 8 — kept
    const line9 = `${'  '.repeat(9)}- button "Deep9"`; // depth 9 — pruned
    const out = compressSnapshot(`${line8}\n${line9}`);
    expect(out).toContain('Deep8');
    expect(out).not.toContain('Deep9');
  });
});

test.describe('LLM response parsers', () => {
  test('parseSelectorResponse reads a well-formed answer, even wrapped in prose', () => {
    expect(parseSelectorResponse('{"selector":"role=button","confidence":0.9}')).toEqual({
      selector: 'role=button',
      confidence: 0.9,
    });
    expect(
      parseSelectorResponse('Here you go: {"selector":"role=link","confidence":0.8} — done'),
    ).toEqual({ selector: 'role=link', confidence: 0.8 });
    expect(parseSelectorResponse('{"selector":null,"confidence":0.0}')).toEqual({
      selector: null,
      confidence: 0,
    });
  });

  test('parseSelectorResponse rejects malformed or off-shape replies', () => {
    expect(parseSelectorResponse('no json here')).toBeNull();
    expect(parseSelectorResponse('{"confidence":"high"}')).toBeNull();
    expect(parseSelectorResponse('{"selector":42,"confidence":0.9}')).toBeNull();
  });

  test('parseVisionResponse reads a bounding box, rejects incomplete ones', () => {
    expect(parseVisionResponse('{"x":10,"y":20,"width":30,"height":40,"confidence":0.91}')).toEqual(
      { x: 10, y: 20, width: 30, height: 40, confidence: 0.91 },
    );
    expect(parseVisionResponse('{"x":10,"y":20,"confidence":0.91}')).toBeNull();
    expect(parseVisionResponse('not json')).toBeNull();
  });
});
