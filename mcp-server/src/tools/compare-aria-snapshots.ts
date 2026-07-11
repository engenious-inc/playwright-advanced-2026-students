import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getSnapshot } from '../data/db.js';

interface CompareAriaSnapshotsArgs {
  baseline_id: string;
  candidate_id: string;
}

interface LineDiff {
  type: 'added' | 'removed';
  line: string;
}

const diffLines = (baseline: string, candidate: string): LineDiff[] => {
  const baseLines = baseline.split('\n');
  const candLines = candidate.split('\n');
  const baseSet = new Set(baseLines);
  const candSet = new Set(candLines);

  const removed: LineDiff[] = baseLines
    .filter((line) => !candSet.has(line))
    .map((line) => ({ type: 'removed', line }));
  const added: LineDiff[] = candLines
    .filter((line) => !baseSet.has(line))
    .map((line) => ({ type: 'added', line }));

  return [...removed, ...added];
};

export const compareAriaSnapshots = async (
  args: CompareAriaSnapshotsArgs,
): Promise<CallToolResult> => {
  const baseline = getSnapshot(args.baseline_id);
  const candidate = getSnapshot(args.candidate_id);

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
