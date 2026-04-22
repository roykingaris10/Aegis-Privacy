import type { ScenarioXpBreakdown } from "@/lib/xp";

export type RubricScore = {
  criterion: string;
  score: number;
  maxPoints: number;
  /** Present from Sprint 2b onwards; Sprint 2a completions have none. */
  commentary?: string;
};

export type ReviewPayload = {
  overallScore: number;
  rubricScores: RubricScore[];
  strengths: string[];
  gaps: string[];
  narrative: string;
  exemplarCommentary: string;
  xp: ScenarioXpBreakdown;
  nextScenarioId: string | null;
  /** True if the coach failed and we served a fallback review. */
  degraded?: boolean;
};
