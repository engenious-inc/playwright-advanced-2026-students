import { test, expect } from '@playwright/test';
import { partitionForShards } from '../../shared/sharding.js';

/**
 * M16 — CI sharding economics. Splitting a suite across N machines is only safe if
 * the partition is a TOTAL, DISJOINT, BALANCED, DETERMINISTIC cover — otherwise a
 * shard silently drops or double-runs tests. These assert exactly those properties
 * (the earlier version only checked that a loop counter stayed inside its own range).
 */
test.describe('M16 sharding economics demo @m16-shard', () => {
  const suite = Array.from({ length: 37 }, (_, i) => `spec-${i}.ts`);
  const SHARDS = 8;

  test('every spec lands in exactly one shard — total, disjoint cover', () => {
    const flat = partitionForShards(suite, SHARDS).flat();
    expect(flat).toHaveLength(suite.length);
    expect(new Set(flat).size).toBe(suite.length); // no spec double-runs
    expect([...flat].sort()).toEqual([...suite].sort()); // no spec dropped
  });

  test('shards stay balanced to within one spec', () => {
    const sizes = partitionForShards(suite, SHARDS).map((shard) => shard.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  test('partition is deterministic across runs', () => {
    expect(partitionForShards(suite, SHARDS)).toEqual(partitionForShards(suite, SHARDS));
  });

  test('shardCount must be a positive integer', () => {
    expect(() => partitionForShards(suite, 0)).toThrow(/positive integer/);
  });
});
