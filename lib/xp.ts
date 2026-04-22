// XP / level / skill helpers.
//
// Level curve (per-level deltas), fit approximately to PROJECT_BRIEF.md:
//
//   delta(n) = round(35 * n^1.5)      // XP to go from level n-1 to level n
//
//   anchor   brief   computed   notes
//   L1→2       100         99   exact-ish
//   L5→6       500        514   ~3% over
//   L12→13   2,000      1,641   ~18% under
//   L30 cum  ~50,000   ~69,000   over (brief L30 figure is aspirational;
//                                 Sprint 3 can rebalance if content
//                                 density changes)
//
// The per-level deltas govern the fit; the cumulative-at-L30 figure in
// the brief is treated as aspirational and isn't hittable with a simple
// smooth curve that also honours the three per-level anchors.
//
// Skill curve (separate, steeper shape, skills cap at 10):
//
//   skillDelta(n) = round(50 * n^1.5)
//
//   L1→2  skill   141 XP
//   L1→5  total ~1,360 XP
//   L1→10 total ~7,750 XP
//
// Scenario XP formula (per brief § 4):
//
//   xp = xpBase
//        * qualityMultiplier           0.5× at 0% → 1.5× at 100%
//        * streakMultiplier            1.0× at 0 days → 1.5× at ≥30 days
//        * firstTimeMultiplier         1.25× on the first scenario of a
//                                      given request type
//     + perfectScoreBonus              +50 if qualityScore === 100
//
// Final value is rounded to the nearest integer.

import type { SkillKey } from "@/lib/skills";

export const MAX_LEVEL = 30;
export const MAX_SKILL_LEVEL = 10;

// ---------- Level curve ----------

function levelDelta(level: number): number {
  return Math.round(35 * Math.pow(level, 1.5));
}

/** Cumulative XP required to have reached `level`. */
export function calculateXpForLevel(level: number): number {
  if (!Number.isFinite(level)) throw new Error("level must be a finite number");
  if (level < 1) throw new Error("level must be >= 1");
  const target = Math.min(Math.floor(level), MAX_LEVEL);
  let total = 0;
  for (let n = 2; n <= target; n++) total += levelDelta(n);
  return total;
}

/** The highest level the given total XP has unlocked. */
export function getLevelForXp(totalXp: number): number {
  if (!Number.isFinite(totalXp)) {
    throw new Error("totalXp must be a finite number");
  }
  if (totalXp < 0) throw new Error("totalXp cannot be negative");
  let level = 1;
  while (level < MAX_LEVEL && totalXp >= calculateXpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

// ---------- Titles ----------

const TITLES: ReadonlyArray<{ maxLevel: number; title: string }> = [
  { maxLevel: 3, title: "Trainee Data Protection Officer" },
  { maxLevel: 7, title: "Data Protection Practitioner" },
  { maxLevel: 12, title: "Data Protection Specialist" },
  { maxLevel: 18, title: "Senior Data Protection Officer" },
  { maxLevel: 24, title: "Lead Data Protection Officer" },
  { maxLevel: MAX_LEVEL, title: "Chief Privacy Officer" },
];

export function getTitleForLevel(level: number): string {
  return (
    TITLES.find((t) => level <= t.maxLevel)?.title ??
    TITLES[TITLES.length - 1].title
  );
}

// Backwards-compat alias (Sprint 1 shipped this name).
export const titleForLevel = getTitleForLevel;

// ---------- Level progress (for the LevelBanner) ----------

export type LevelProgress = {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  percent: number;
};

/**
 * Computes progress within the user's current level. If `level` is omitted
 * it's derived from `totalXp`.
 */
export function levelProgress(totalXp: number, level?: number): LevelProgress {
  const resolvedLevel = level ?? getLevelForXp(totalXp);
  const floor = calculateXpForLevel(resolvedLevel);
  const ceiling =
    resolvedLevel >= MAX_LEVEL ? floor : calculateXpForLevel(resolvedLevel + 1);
  const xpIntoLevel = Math.max(0, totalXp - floor);
  const xpNeededForLevel = Math.max(1, ceiling - floor);
  const percent =
    resolvedLevel >= MAX_LEVEL
      ? 100
      : Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100));
  return {
    level: resolvedLevel,
    title: getTitleForLevel(resolvedLevel),
    xpIntoLevel,
    xpNeededForLevel,
    percent,
  };
}

/** Backwards-compat for Sprint 1 call sites. */
export function xpForLevel(level: number): number {
  return calculateXpForLevel(level);
}

// ---------- Skill curve ----------

function skillLevelDelta(skillLevel: number): number {
  return Math.round(50 * Math.pow(skillLevel, 1.5));
}

/** Cumulative skill XP required to reach the given skill level (1–10). */
export function getSkillXpForLevel(skillLevel: number): number {
  if (!Number.isFinite(skillLevel)) {
    throw new Error("skillLevel must be a finite number");
  }
  if (skillLevel < 0) throw new Error("skillLevel cannot be negative");
  const target = Math.min(Math.floor(skillLevel), MAX_SKILL_LEVEL);
  if (target <= 0) return 0;
  let total = 0;
  for (let n = 1; n <= target; n++) total += skillLevelDelta(n + 1);
  return total;
}

/** Highest skill level the given skill XP has unlocked (0–10). */
export function getSkillLevelForXp(skillXp: number): number {
  if (!Number.isFinite(skillXp)) {
    throw new Error("skillXp must be a finite number");
  }
  if (skillXp < 0) throw new Error("skillXp cannot be negative");
  let level = 0;
  while (level < MAX_SKILL_LEVEL && skillXp >= getSkillXpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

// ---------- Scenario XP award ----------

export type ScenarioXpInputs = {
  xpBase: number;
  qualityScore: number; // 0–100
  streak: number; // consecutive active days
  isFirstTime: boolean;
};

export type ScenarioXpBreakdown = {
  base: number;
  qualityMultiplier: number;
  streakMultiplier: number;
  firstTimeMultiplier: number;
  perfectScoreBonus: number;
  total: number;
};

export function calculateScenarioXp(
  inputs: ScenarioXpInputs,
): ScenarioXpBreakdown {
  const { xpBase, qualityScore, streak, isFirstTime } = inputs;
  if (xpBase < 0) throw new Error("xpBase cannot be negative");
  if (qualityScore < 0 || qualityScore > 100) {
    throw new Error("qualityScore must be between 0 and 100");
  }
  if (streak < 0) throw new Error("streak cannot be negative");

  const qualityMultiplier = 0.5 + qualityScore / 100;
  const streakMultiplier = 1 + 0.5 * Math.min(streak / 30, 1);
  const firstTimeMultiplier = isFirstTime ? 1.25 : 1;
  const perfectScoreBonus = qualityScore === 100 ? 50 : 0;

  const total =
    Math.round(
      xpBase * qualityMultiplier * streakMultiplier * firstTimeMultiplier,
    ) + perfectScoreBonus;

  return {
    base: xpBase,
    qualityMultiplier,
    streakMultiplier,
    firstTimeMultiplier,
    perfectScoreBonus,
    total,
  };
}

// ---------- Skill progress helper ----------

export type SkillProgressRecord = Record<
  SkillKey,
  { level: number; xp: number }
>;
