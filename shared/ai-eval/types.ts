/**
 * Shared types for the M20 "testing AI features" tier.
 * Mirrors shared/tiered-ai: typed surface on main, full impls on the m20 branch.
 */
export type JudgeVerdict = {
  passed: boolean;
  score: number; // 0..1
  rationale: string;
};

export type RubricCriterion = {
  id: string;
  description: string;
  weight: number; // 0..1
};

export type Rubric = {
  id: string;
  version: string; // pin the rubric so a model update is a visible diff
  criteria: readonly RubricCriterion[];
};
