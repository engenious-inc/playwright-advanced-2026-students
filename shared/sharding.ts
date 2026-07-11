/**
 * Deterministic test-suite sharding (M16 — CI/CD economics).
 *
 * Models what `playwright test --shard=i/n` does: split a suite across N CI
 * machines. The properties CI relies on — total coverage, disjointness, balance,
 * determinism — are exactly what the M16 sharding demo asserts against this.
 *
 * Round-robin assignment keeps shards balanced to within one item regardless of
 * suite size, which is why per-shard wall-clock stays even.
 */
export function partitionForShards<T>(items: readonly T[], shardCount: number): T[][] {
  if (!Number.isInteger(shardCount) || shardCount < 1) {
    throw new Error(`shardCount must be a positive integer, got ${String(shardCount)}`);
  }
  return Array.from({ length: shardCount }, (_, shard) =>
    items.filter((_item, index) => index % shardCount === shard),
  );
}
