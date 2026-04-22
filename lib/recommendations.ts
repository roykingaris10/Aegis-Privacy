// Scenario recommendation for Today's Inbox. Not clever — a lightweight
// heuristic that picks scenarios the user hasn't done yet, blending a
// strongest-skill quick win, a weakest-skill growth pick, a current-tier
// stretch, and a next-tier preview. New users (fewer than 3 completions)
// get four Tier-1 picks so the first hour of the app feels approachable.

import type { Scenario } from "@/lib/scenarios";
import { SKILLS, type SkillKey } from "@/lib/skills";

type Inputs = {
  userLevel: number;
  skillLevels: Partial<Record<SkillKey, number>>;
  completionsCount: number;
  completedIds: ReadonlySet<string>;
  scenarios: ReadonlyArray<Scenario>;
};

export function recommendTodaysInbox(inputs: Inputs): Scenario[] {
  const { userLevel, skillLevels, completionsCount, completedIds, scenarios } =
    inputs;

  const remaining = scenarios.filter((s) => !completedIds.has(s.id));
  if (remaining.length === 0) return [];

  // Fresh user: four Tier-1 scenarios (or as many as exist).
  if (completionsCount < 3) {
    return remaining
      .filter((s) => s.tier === 1)
      .concat(remaining.filter((s) => s.tier !== 1))
      .slice(0, 4);
  }

  const currentTier: 1 | 2 | 3 = userLevel >= 13 ? 3 : userLevel >= 6 ? 2 : 1;
  const nextTier = currentTier === 3 ? null : ((currentTier + 1) as 2 | 3);

  const sortedSkills = [...SKILLS].sort((a, b) => {
    const la = skillLevels[a.key] ?? 0;
    const lb = skillLevels[b.key] ?? 0;
    return lb - la;
  });
  const strongest = sortedSkills[0]?.key;
  const weakest = sortedSkills[sortedSkills.length - 1]?.key;

  const picks: Scenario[] = [];
  const pick = (s: Scenario | undefined) => {
    if (s && !picks.some((p) => p.id === s.id)) picks.push(s);
  };

  // 1: strongest-skill quick win in current tier
  pick(remaining.find((s) => s.skill === strongest && s.tier === currentTier));

  // 2: weakest-skill growth in current tier
  pick(remaining.find((s) => s.skill === weakest && s.tier === currentTier));

  // 3: any current-tier scenario at a difficulty not yet attempted
  pick(remaining.find((s) => s.tier === currentTier));

  // 4: next-tier preview (or another current-tier)
  if (nextTier) {
    pick(remaining.find((s) => s.tier === nextTier));
  }

  // Top up with whatever's left, up to 4.
  for (const s of remaining) {
    if (picks.length >= 4) break;
    pick(s);
  }

  return picks.slice(0, 4);
}
