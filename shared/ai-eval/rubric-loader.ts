import { z } from 'zod';
import type { Rubric } from './types.js';

const rubricSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  criteria: z
    .array(
      z.object({
        id: z.string().min(1),
        description: z.string().min(1),
        weight: z.number().min(0).max(1),
      }),
    )
    .min(1),
});

/**
 * Parse + validate a rubric from untrusted input (YAML/JSON on disk).
 * Throws with the zod issue list on malformed input. Referenced in 20.C.
 */
export function loadRubric(raw: unknown): Rubric {
  return rubricSchema.parse(raw);
}
