import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { fixtureSnapshots } from '../data/fixtures.js';

interface CompareAriaSnapshotsArgs {
  baseline_id: string;
  candidate_id: string;
}

interface LineDiff {
  type: 'added' | 'removed';
  line: string;
}

// Line-level LCS diff: emits ordered removed/added runs. Unlike a set-based diff, this
// catches duplicated identical nodes and same-level sibling reorders in a dense ARIA tree.
export const diffLines = (baseline: string, candidate: string): LineDiff[] => {
  const a = baseline.split('\n');
  const b = candidate.split('\n');
  const m = a.length;
  const n = b.length;

  // dp[i][j] = LCS length of a[i:] and b[j:].
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    const row = dp[i] as number[];
    const next = dp[i + 1] as number[];
    for (let j = n - 1; j >= 0; j--) {
      row[j] =
        a[i] === b[j]
          ? (next[j + 1] as number) + 1
          : Math.max(next[j] as number, row[j + 1] as number);
    }
  }

  const out: LineDiff[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if ((dp[i + 1] as number[])[j]! >= (dp[i] as number[])[j + 1]!) {
      out.push({ type: 'removed', line: a[i] as string });
      i++;
    } else {
      out.push({ type: 'added', line: b[j] as string });
      j++;
    }
  }
  while (i < m) out.push({ type: 'removed', line: a[i++] as string });
  while (j < n) out.push({ type: 'added', line: b[j++] as string });
  return out;
};

export const compareAriaSnapshots = async (
  args: CompareAriaSnapshotsArgs,
): Promise<CallToolResult> => {
  const baseline = fixtureSnapshots[args.baseline_id];
  const candidate = fixtureSnapshots[args.candidate_id];

  if (baseline === undefined || candidate === undefined) {
    throw new Error(
      `Snapshot not found. baseline_id=${args.baseline_id} found=${baseline !== undefined}, candidate_id=${args.candidate_id} found=${candidate !== undefined}`,
    );
  }

  const diff = diffLines(baseline.tree, candidate.tree);
  const payload = {
    baseline: { id: baseline.id, captured_at: baseline.captured_at, url: baseline.url },
    candidate: { id: candidate.id, captured_at: candidate.captured_at, url: candidate.url },
    diff,
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
  };
};
