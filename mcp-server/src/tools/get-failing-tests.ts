import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getFailuresSince } from '../data/db.js';

interface GetFailingTestsArgs {
  since: string | undefined;
  limit: number | undefined;
}

export const getFailingTests = async (args: GetFailingTestsArgs): Promise<CallToolResult> => {
  const sinceMs =
    args.since !== undefined ? Date.parse(args.since) : Date.now() - 24 * 60 * 60 * 1000;
  const limit = args.limit ?? 50;

  const filtered = getFailuresSince(sinceMs, limit);

  return {
    content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
  };
};
