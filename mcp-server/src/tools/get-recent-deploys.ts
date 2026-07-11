import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { fixtureDeploys } from '../data/fixtures.js';

interface GetRecentDeploysArgs {
  limit: number | undefined;
}

export const getRecentDeploys = async (args: GetRecentDeploysArgs): Promise<CallToolResult> => {
  const limit = args.limit ?? 10;
  const sorted = [...fixtureDeploys]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, limit);

  return {
    content: [{ type: 'text', text: JSON.stringify(sorted, null, 2) }],
  };
};
