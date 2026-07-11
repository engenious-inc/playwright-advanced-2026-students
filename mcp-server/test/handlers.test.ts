/**
 * MCP tool handler unit tests (M10).
 * Risks: time-window filtering, glob matching, deploy sort order, snapshot diff + missing-id errors.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { fixtureDeploys, fixtureFailures, fixtureFlakes } from '../src/data/fixtures.js';
import { compareAriaSnapshots } from '../src/tools/compare-aria-snapshots.js';
import { getFailingTests } from '../src/tools/get-failing-tests.js';
import { getFlakeRate } from '../src/tools/get-flake-rate.js';
import { getRecentDeploys } from '../src/tools/get-recent-deploys.js';

interface TestFailureRow {
  test_path: string;
  timestamp: string;
}

interface FlakeRatePayload {
  window_days: number;
  matches: Array<{ test_path: string; flake_rate: number }>;
}

interface DeployRow {
  timestamp: string;
  commit: string;
}

interface SnapshotDiffPayload {
  baseline: { id: string };
  candidate: { id: string };
  diff: Array<{ type: 'added' | 'removed'; line: string }>;
}

const parseTextJson = (result: CallToolResult): unknown => {
  const block = result.content[0];
  assert.equal(block?.type, 'text');
  return JSON.parse(block.text) as unknown;
};

describe('getFailingTests', () => {
  it('returns fixture failures within the default 24-hour window', async () => {
    const result = await getFailingTests({ since: undefined, limit: undefined });
    const rows = parseTextJson(result) as TestFailureRow[];

    assert.equal(rows.length, fixtureFailures.length);
    assert.deepEqual(
      rows.map((row) => row.test_path),
      fixtureFailures.map((row) => row.test_path),
    );
  });

  it('filters failures older than the since timestamp', async () => {
    const cutoff = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString();
    const result = await getFailingTests({ since: cutoff, limit: undefined });
    const rows = parseTextJson(result) as TestFailureRow[];

    const expected = fixtureFailures.filter(
      (failure) => Date.parse(failure.timestamp) >= Date.parse(cutoff),
    );
    assert.equal(rows.length, expected.length);
    assert.ok(rows.every((row) => Date.parse(row.timestamp) >= Date.parse(cutoff)));
  });

  it('respects the limit after filtering', async () => {
    const result = await getFailingTests({ since: undefined, limit: 1 });
    const rows = parseTextJson(result) as TestFailureRow[];

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.test_path, fixtureFailures[0]?.test_path);
  });

  it('returns an empty list when since is in the future', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const result = await getFailingTests({ since: future, limit: undefined });
    const rows = parseTextJson(result) as TestFailureRow[];

    assert.deepEqual(rows, []);
  });
});

describe('getFlakeRate', () => {
  it('matches an exact test path', async () => {
    const target = fixtureFlakes[0];
    assert.ok(target !== undefined);

    const result = await getFlakeRate({
      test_path_pattern: target.test_path,
      window_days: undefined,
    });
    const payload = parseTextJson(result) as FlakeRatePayload;

    assert.equal(payload.window_days, 7);
    assert.equal(payload.matches.length, 1);
    assert.equal(payload.matches[0]?.test_path, target.test_path);
    assert.equal(payload.matches[0]?.flake_rate, target.flake_rate);
  });

  it('matches glob patterns with asterisks', async () => {
    const result = await getFlakeRate({
      test_path_pattern: 'tests/auth/*',
      window_days: undefined,
    });
    const payload = parseTextJson(result) as FlakeRatePayload;

    const authPaths = fixtureFlakes
      .filter((record) => record.test_path.startsWith('tests/auth/'))
      .map((record) => record.test_path);

    assert.deepEqual(payload.matches.map((row) => row.test_path).sort(), authPaths.sort());
  });

  it('echoes a custom window_days value in the response', async () => {
    const result = await getFlakeRate({
      test_path_pattern: 'tests/auth/login.spec.ts',
      window_days: 14,
    });
    const payload = parseTextJson(result) as FlakeRatePayload;

    assert.equal(payload.window_days, 14);
  });

  it('returns no matches when the pattern matches nothing', async () => {
    const result = await getFlakeRate({
      test_path_pattern: 'tests/nonexistent/**',
      window_days: undefined,
    });
    const payload = parseTextJson(result) as FlakeRatePayload;

    assert.deepEqual(payload.matches, []);
  });
});

describe('getRecentDeploys', () => {
  it('returns deploys sorted newest first', async () => {
    const result = await getRecentDeploys({ limit: undefined });
    const rows = parseTextJson(result) as DeployRow[];

    const expected = [...fixtureDeploys]
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .map((row) => row.commit);

    assert.deepEqual(
      rows.map((row) => row.commit),
      expected,
    );
  });

  it('respects the limit after sorting', async () => {
    const result = await getRecentDeploys({ limit: 2 });
    const rows = parseTextJson(result) as DeployRow[];

    assert.equal(rows.length, 2);
    assert.ok(Date.parse(rows[0]?.timestamp ?? '') >= Date.parse(rows[1]?.timestamp ?? ''));
  });
});

describe('compareAriaSnapshots', () => {
  it('returns structural diff entries for known baseline and candidate snapshots', async () => {
    const result = await compareAriaSnapshots({
      baseline_id: 'home-baseline',
      candidate_id: 'home-candidate',
    });
    const payload = parseTextJson(result) as SnapshotDiffPayload;

    assert.equal(payload.baseline.id, 'home-baseline');
    assert.equal(payload.candidate.id, 'home-candidate');
    assert.ok(payload.diff.some((entry) => entry.type === 'added' && entry.line.includes('Live')));
    assert.ok(payload.diff.every((entry) => entry.type === 'added' || entry.type === 'removed'));
  });

  it('throws when either snapshot id is missing from fixtures', async () => {
    await assert.rejects(
      () =>
        compareAriaSnapshots({
          baseline_id: 'missing-baseline',
          candidate_id: 'home-candidate',
        }),
      /Snapshot not found.*baseline_id=missing-baseline found=false/,
    );

    await assert.rejects(
      () =>
        compareAriaSnapshots({
          baseline_id: 'home-baseline',
          candidate_id: 'missing-candidate',
        }),
      /Snapshot not found.*candidate_id=missing-candidate found=false/,
    );
  });
});
