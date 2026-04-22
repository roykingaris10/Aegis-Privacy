import type { ScenarioXpBreakdown } from "@/lib/xp";

export type RubricScore = {
  criterion: string;
  score: number;
  maxPoints: number;
};

export type ReviewPayload = {
  overallScore: number;
  rubricScores: RubricScore[];
  narrative: string;
  xp: ScenarioXpBreakdown;
  nextScenarioId: string | null;
};
