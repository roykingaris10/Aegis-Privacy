import type { ScenarioXpBreakdown } from "@/lib/xp";
import type { BadgeRarity } from "@/lib/badges";

export type RubricScore = {
  criterion: string;
  score: number;
  maxPoints: number;
  /** Present from Sprint 2b onwards; Sprint 2a completions have none. */
  commentary?: string;
};

export type AwardedBadge = {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  icon: string;
};

export type GamificationPayload = {
  leveledUp: boolean;
  newLevel: number;
  skillLeveledUp: boolean;
  skillKey: string;
  newSkillLevel: number;
  streak: number;
  streakMilestone: number | null;
  tierUnlocked: 2 | 3 | null;
  newlyAwardedBadges: AwardedBadge[];
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
  /** Sprint 3a: signals for the post-submit toast queue. */
  gamification?: GamificationPayload;
};
