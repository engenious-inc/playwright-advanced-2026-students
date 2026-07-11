import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getFailingTests } from './tools/get-failing-tests.js';
import { getFlakeRate } from './tools/get-flake-rate.js';
import { getRecentDeploys } from './tools/get-recent-deploys.js';
import { compareAriaSnapshots } from './tools/compare-aria-snapshots.js';

const server = new McpServer({ name: 'qa-workflow', version: '1.0.0' });

server.registerTool(
  'get_failing_tests',
  {
    description:
      'Returns tests that failed in CI runs within the specified time window. ' +
      'Use this to investigate recent regressions or identify flaky tests. ' +
      'Returns up to 50 most recent failures with timestamps, test paths, and failure messages.',
    inputSchema: {
      since: z.string().optional().describe('ISO 8601 timestamp. Defaults to 24 hours ago.'),
      limit: z
        .number()
        .min(1)
        .max(200)
        .optional()
        .describe('Max number of failures to return. Defaults to 50, max 200.'),
    },
  },
  getFailingTests,
);

server.registerTool(
  'get_flake_rate',
  {
    description:
      'Returns the flake rate (proportion of runs that failed and were retried successfully) for tests matching a path pattern. ' +
      'Use this to identify unreliable tests, not broken ones. ' +
      'On main, fixtures are static — window_days is echoed but does not filter historical data.',
    inputSchema: {
      test_path_pattern: z
        .string()
        .describe('Glob pattern matching test file paths, e.g. "login*" or "tests/auth/**".'),
      window_days: z
        .number()
        .min(1)
        .max(90)
        .optional()
        .describe('Window of CI history to compute over, in days. Defaults to 7, max 90.'),
    },
  },
  getFlakeRate,
);

server.registerTool(
  'get_recent_deploys',
  {
    description:
      'Returns the most recent production deploys with timestamps, commit SHAs, and the list of services included in each deploy. ' +
      'Use this to correlate test failures or flake-rate spikes with recent code changes.',
    inputSchema: {
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe('Max number of deploys to return. Defaults to 10, max 50.'),
    },
  },
  getRecentDeploys,
);

server.registerTool(
  'compare_aria_snapshots',
  {
    description:
      'Compares two saved ARIA snapshots (structural-tree representations of a page) and returns the diff. ' +
      'Use this to identify which DOM structure changed between two points in time — e.g. before and after a deploy.',
    inputSchema: {
      baseline_id: z.string().describe('Identifier of the baseline snapshot.'),
      candidate_id: z
        .string()
        .describe('Identifier of the snapshot to compare against the baseline.'),
    },
  },
  compareAriaSnapshots,
);

await server.connect(new StdioServerTransport());
