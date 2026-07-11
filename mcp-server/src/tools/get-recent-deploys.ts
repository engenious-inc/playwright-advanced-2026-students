import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getRecentDeploys as queryRecentDeploys } from '../data/db.js';

interface GetRecentDeploysArgs {
  limit: number | undefined;
}

export const getRecentDeploys = async (args: GetRecentDeploysArgs): Promise<CallToolResult> => {
  const limit = args.limit ?? 10;
  const sorted = queryRecentDeploys(limit);

  return {
    content: [{ type: 'text', text: JSON.stringify(sorted, null, 2) }],
  };
};
