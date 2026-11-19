import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'qa-workflow',
  version: '0.1.0',
});

server.registerTool(
  'get_failing_tests',
  {
    description:
      'Returns tests that failed in CI runs within the specified time window. Use this to investigate recent regressions or identify flaky tests.',
    inputSchema: {
      since: z.string().optional().describe('ISO 8601 timestamp. Defaults to 24 hours ago.'),
      limit: z
        .number()
        .optional()
        .describe('Max number of failures to return. Defaults to 50, max 200.'),
    },
  },
  async ({ since: _since, limit: _limit }) => {
    // Hardcoded for the demo. Module 10.D wires this to fixtures (SQLite on a future branch).
    const failing = ['login.spec.ts:32', 'checkout.spec.ts:18'];
    return { content: [{ type: 'text', text: JSON.stringify(failing) }] };
  },
);

await server.connect(new StdioServerTransport());
