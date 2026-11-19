import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getFailingTests } from './tools/get-failing-tests.js';

// 10.C's "human-style" tool design counterexample — registered as a standalone
// server (name: qa-bad) so it can run side-by-side with the real `qa-workflow`
// server (see index.ts) for the live A/B demo. Same handler, same fixtures;
// the only difference is the schema/description quality, which is the point.
const server = new McpServer({ name: 'qa-bad', version: '0.1.0' });

server.registerTool(
  'get_failing_tests',
  {
    description: '',
    inputSchema: {
      since: z.string().optional(),
    },
  },
  // The bad schema never declares `limit`, so Claude never sends one — matching
  // 10.C's "no since, no limit" A/B outcome. Widened here only to satisfy the
  // shared handler's type signature.
  (args: { since: string | undefined }) => getFailingTests({ ...args, limit: undefined }),
);

await server.connect(new StdioServerTransport());
