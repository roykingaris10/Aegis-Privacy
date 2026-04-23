// Badge registry and post-completion awarding.
//
// Badges are pure data — each has a criteria function that takes a
// UserStats snapshot and returns a boolean. After every completion, we
// build a fresh snapshot and run every badge's criteria; any newly-
// qualified ones are persisted to User.badges (Json string[]) and
// returned to the caller so the UI can toast them.

import type { SkillKey } from "@/lib/skills";

export type BadgeRarity = "common" | "uncommon" | "rare" | "legendary";

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  rarity: BadgeRarity;
  criteria: (stats: UserStats) => boolean;
};

export type CompletionSummary = {
  scenarioId: string;
  tier: 1 | 2 | 3;
  skill: SkillKey;
  difficulty: "straightforward" | "complex" | "contested";
  score: number;
  /** All per-criterion scores for this completion. */
  rubric: Array<{ criterion: string; score: number; maxPoints: number }>;
};

export type UserStats = {
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  skillLevels: Partial<Record<SkillKey, number>>;
  skillsCompleted: Set<SkillKey>;
  completions: CompletionSummary[];
  /** Any guide viewed yet? Flipped based on GuideProgress. */
  viewedAnyGuide: boolean;
  /** Total guides completed (read or quizzed). */
  guidesCompleted: number;
  /** Skills covered by completed guides. */
  guideSkills: Set<SkillKey>;
  /** Whether the user got 100% on any quiz. */
  perfectQuiz: boolean;
  /** Whether the user completed all guides in any study track. */
  completedAnyTrack: boolean;
};

// The 15 seed badges.
export const BADGES: ReadonlyArray<Badge> = [
  // Common
  {
    id: "first_blood",
    name: "First Blood",
    description: "Complete your first scenario.",
    icon: "Zap",
    rarity: "common",
    criteria: (s) => s.completions.length >= 1,
  },
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Reach Level 2.",
    icon: "Sparkles",
    rarity: "common",
    criteria: (s) => s.level >= 2,
  },
  {
    id: "day_one",
    name: "Day One",
    description: "Complete any scenario on the day you sign up.",
    icon: "Sunrise",
    rarity: "common",
    // Approximation: awarded whenever the user has at least one
    // completion (cheap for launch). Sprint 3b can scope to join-day.
    criteria: (s) => s.completions.length >= 1,
  },
  {
    id: "reading_is_fundamental",
    name: "Reading Is Fundamental",
    description: "Read your first learning resource.",
    icon: "BookOpen",
    rarity: "common",
    criteria: (s) => s.viewedAnyGuide,
  },
  {
    id: "streak_beginner",
    name: "Streak Beginner",
    description: "Keep a 3-day streak.",
    icon: "Flame",
    rarity: "common",
    criteria: (s) => s.currentStreak >= 3 || s.longestStreak >= 3,
  },

  // Uncommon
  {
    id: "perfect_score",
    name: "Perfect Score",
    description: "Score 100 on any scenario.",
    icon: "Trophy",
    rarity: "uncommon",
    criteria: (s) => s.completions.some((c) => c.score >= 100),
  },
  {
    id: "tier_climber",
    name: "Tier Climber",
    description: "Complete your first Tier II scenario.",
    icon: "TrendingUp",
    rarity: "uncommon",
    criteria: (s) => s.completions.some((c) => c.tier === 2),
  },
  {
    id: "skill_starter",
    name: "Skill Starter",
    description: "Reach Level 3 in any skill.",
    icon: "Star",
    rarity: "uncommon",
    criteria: (s) => Object.values(s.skillLevels).some((l) => (l ?? 0) >= 3),
  },
  {
    id: "streak_keeper",
    name: "Streak Keeper",
    description: "Keep a 7-day streak.",
    icon: "Flame",
    rarity: "uncommon",
    criteria: (s) => s.currentStreak >= 7 || s.longestStreak >= 7,
  },
  {
    id: "all_rounder",
    name: "All-Rounder",
    description: "Complete scenarios in 5 different skills.",
    icon: "Target",
    rarity: "uncommon",
    criteria: (s) => s.skillsCompleted.size >= 5,
  },

  // Rare
  {
    id: "no_stone_unturned",
    name: "No Stone Unturned",
    description:
      "On a complex SAR scenario, score above zero on every rubric criterion.",
    icon: "Search",
    rarity: "rare",
    criteria: (s) =>
      s.completions.some(
        (c) =>
          c.skill === "sar_handling" &&
          c.difficulty === "complex" &&
          c.rubric.every((r) => r.score > 0),
      ),
  },
  {
    id: "firefighter",
    name: "Firefighter",
    description: "Score 85 or higher on a breach-response scenario.",
    icon: "Siren",
    rarity: "rare",
    criteria: (s) =>
      s.completions.some((c) => c.skill === "breach_response" && c.score >= 85),
  },
  {
    id: "tier_3_unlocked",
    name: "Tier III Unlocked",
    description: "Reach Level 13 — Enterprise clients are in play.",
    icon: "Crown",
    rarity: "rare",
    criteria: (s) => s.level >= 13,
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Keep a 30-day streak.",
    icon: "Flame",
    rarity: "rare",
    criteria: (s) => s.currentStreak >= 30 || s.longestStreak >= 30,
  },

  // Legendary
  {
    id: "polymath",
    name: "Polymath",
    description: "Reach Level 5 in all ten skills.",
    icon: "GraduationCap",
    rarity: "legendary",
    criteria: (s) => {
      const values = Object.values(s.skillLevels).filter(
        (v): v is number => typeof v === "number",
      );
      return values.length >= 10 && values.every((l) => l >= 5);
    },
  },

  // Learning badges (Sprint 3b)
  {
    id: "well_read",
    name: "Well Read",
    description: "Complete your first guide.",
    icon: "BookOpen",
    rarity: "common",
    criteria: (s) => s.guidesCompleted >= 1,
  },
  {
    id: "scholar",
    name: "Scholar",
    description: "Complete 5 guides.",
    icon: "Library",
    rarity: "uncommon",
    criteria: (s) => s.guidesCompleted >= 5,
  },
  {
    id: "perfect_recall",
    name: "Perfect Recall",
    description: "Get 100% on any guide quiz.",
    icon: "Brain",
    rarity: "uncommon",
    criteria: (s) => s.perfectQuiz,
  },
  {
    id: "cross_trained",
    name: "Cross-Trained",
    description: "Complete guides covering 3 or more skills.",
    icon: "Waypoints",
    rarity: "uncommon",
    criteria: (s) => s.guideSkills.size >= 3,
  },
  {
    id: "study_tracker",
    name: "Study Tracker",
    description: "Complete all guides in any study track.",
    icon: "Route",
    rarity: "rare",
    criteria: (s) => s.completedAnyTrack,
  },
];

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

/** Returns the set of badge ids the user qualifies for under these stats. */
export function qualifyingBadges(stats: UserStats): string[] {
  return BADGES.filter((b) => b.criteria(stats)).map((b) => b.id);
}

/** Returns only badges the user newly qualifies for (not already earned). */
export function newlyAwardedBadges(
  stats: UserStats,
  existing: ReadonlyArray<string>,
): Badge[] {
  const have = new Set(existing);
  return BADGES.filter((b) => !have.has(b.id) && b.criteria(stats));
}
