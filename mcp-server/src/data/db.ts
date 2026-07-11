import { DatabaseSync } from 'node:sqlite';
import {
  fixtureFailures,
  fixtureFlakes,
  fixtureDeploys,
  fixtureSnapshots,
  type TestFailure,
  type FlakeRecord,
  type DeployRecord,
  type AriaSnapshot,
} from './fixtures.js';

/**
 * SQLite-backed store for the qa-workflow MCP server (M10 lecture 10.D).
 *
 * `main` serves the tools from in-memory fixture arrays; this branch swaps in a
 * real SQL backend using Node's built-in `node:sqlite` (no native dependency —
 * requires the `--experimental-sqlite` flag, wired into the npm scripts and
 * `.mcp.json`). The DB is seeded once from `fixtures.ts` so the seed data (and
 * the handler tests that assert against it) stay a single source of truth.
 */

const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE failures (test_path TEXT, line INTEGER, timestamp TEXT, ts_ms INTEGER, message TEXT, attempt INTEGER);
  CREATE TABLE flakes (test_path TEXT, runs INTEGER, flakes INTEGER, flake_rate REAL);
  CREATE TABLE deploys (timestamp TEXT, ts_ms INTEGER, commit_sha TEXT, services TEXT, author TEXT);
  CREATE TABLE snapshots (id TEXT PRIMARY KEY, captured_at TEXT, url TEXT, tree TEXT);
`);

const insertFailure = db.prepare(
  'INSERT INTO failures (test_path, line, timestamp, ts_ms, message, attempt) VALUES (?, ?, ?, ?, ?, ?)',
);
for (const f of fixtureFailures) {
  insertFailure.run(
    f.test_path,
    f.line,
    f.timestamp,
    Date.parse(f.timestamp),
    f.message,
    f.attempt,
  );
}

const insertFlake = db.prepare(
  'INSERT INTO flakes (test_path, runs, flakes, flake_rate) VALUES (?, ?, ?, ?)',
);
for (const r of fixtureFlakes) {
  insertFlake.run(r.test_path, r.runs, r.flakes, r.flake_rate);
}

const insertDeploy = db.prepare(
  'INSERT INTO deploys (timestamp, ts_ms, commit_sha, services, author) VALUES (?, ?, ?, ?, ?)',
);
for (const d of fixtureDeploys) {
  insertDeploy.run(
    d.timestamp,
    Date.parse(d.timestamp),
    d.commit,
    JSON.stringify(d.services),
    d.author,
  );
}

const insertSnapshot = db.prepare(
  'INSERT INTO snapshots (id, captured_at, url, tree) VALUES (?, ?, ?, ?)',
);
for (const s of Object.values(fixtureSnapshots)) {
  insertSnapshot.run(s.id, s.captured_at, s.url, s.tree);
}

type Row = Record<string, string | number | bigint | Uint8Array | null>;

/** Failures at or after `sinceMs`, in insertion order, capped at `limit`. */
export function getFailuresSince(sinceMs: number, limit: number): TestFailure[] {
  const rows = db
    .prepare(
      'SELECT test_path, line, timestamp, message, attempt FROM failures WHERE ts_ms >= ? LIMIT ?',
    )
    .all(sinceMs, limit) as Row[];
  return rows.map((r) => ({
    test_path: String(r.test_path),
    line: Number(r.line),
    timestamp: String(r.timestamp),
    message: String(r.message),
    attempt: Number(r.attempt),
  }));
}

/** All flake records (the tool applies glob matching in JS). */
export function getAllFlakes(): FlakeRecord[] {
  const rows = db.prepare('SELECT test_path, runs, flakes, flake_rate FROM flakes').all() as Row[];
  return rows.map((r) => ({
    test_path: String(r.test_path),
    runs: Number(r.runs),
    flakes: Number(r.flakes),
    flake_rate: Number(r.flake_rate),
  }));
}

/** Most recent deploys first, capped at `limit`. */
export function getRecentDeploys(limit: number): DeployRecord[] {
  const rows = db
    .prepare(
      'SELECT timestamp, commit_sha, services, author FROM deploys ORDER BY ts_ms DESC LIMIT ?',
    )
    .all(limit) as Row[];
  return rows.map((r) => {
    const services: unknown = JSON.parse(String(r.services));
    return {
      timestamp: String(r.timestamp),
      commit: String(r.commit_sha),
      services: Array.isArray(services) ? services.map(String) : [],
      author: String(r.author),
    };
  });
}

/** One snapshot by id, or undefined if absent. */
export function getSnapshot(id: string): AriaSnapshot | undefined {
  const row = db
    .prepare('SELECT id, captured_at, url, tree FROM snapshots WHERE id = ?')
    .get(id) as Row | undefined;
  if (row === undefined) return undefined;
  return {
    id: String(row.id),
    captured_at: String(row.captured_at),
    url: String(row.url),
    tree: String(row.tree),
  };
}
