import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getAllFlakes } from '../data/db.js';

interface GetFlakeRateArgs {
  test_path_pattern: string;
  window_days: number | undefined;
}

const globToRegex = (pattern: string): RegExp => {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
};

export const getFlakeRate = async (args: GetFlakeRateArgs): Promise<CallToolResult> => {
  const matcher = globToRegex(args.test_path_pattern);
  const matches = getAllFlakes().filter((record) => matcher.test(record.test_path));

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ window_days: args.window_days ?? 7, matches }, null, 2),
      },
    ],
  };
};
