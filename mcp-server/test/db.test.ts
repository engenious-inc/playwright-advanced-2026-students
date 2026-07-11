/**
 * SQLite data-layer unit tests (M10). Seeded once from fixtures.ts at import.
 * Run via `npm run test:mcp` (sets NODE_OPTIONS=--experimental-sqlite).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getFailuresSince, getAllFlakes, getRecentDeploys, getSnapshot } from '../src/data/db.js';
import { fixtureFailures, fixtureFlakes, fixtureDeploys } from '../src/data/fixtures.js';

describe('M10 SQLite data layer', () => {
  it('returns all failures at or after epoch, capped by limit', () => {
    assert.equal(getFailuresSince(0, 50).length, fixtureFailures.length);
    assert.equal(getFailuresSince(0, 2).length, 2);
  });

  it('filters failures by the since window', () => {
    const future = Date.now() + 60 * 60 * 1000;
    assert.deepEqual(getFailuresSince(future, 50), []);
  });

  it('returns all flake records', () => {
    assert.equal(getAllFlakes().length, fixtureFlakes.length);
  });

  it('returns deploys newest-first with services parsed back to an array', () => {
    const deploys = getRecentDeploys(10);
    assert.equal(deploys.length, fixtureDeploys.length);
    for (let i = 1; i < deploys.length; i += 1) {
      const prev = deploys[i - 1];
      const curr = deploys[i];
      assert.ok(prev !== undefined && curr !== undefined);
      assert.ok(Date.parse(prev.timestamp) >= Date.parse(curr.timestamp));
    }
    assert.ok(Array.isArray(deploys[0]?.services));
  });

  it('caps deploys by limit', () => {
    assert.equal(getRecentDeploys(1).length, 1);
  });

  it('gets a snapshot by id and returns undefined for a missing one', () => {
    const snap = getSnapshot('home-baseline');
    assert.equal(snap?.id, 'home-baseline');
    assert.ok((snap?.tree.length ?? 0) > 0);
    assert.equal(getSnapshot('does-not-exist'), undefined);
  });
});
