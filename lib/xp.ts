// XP / level helpers. Curve is a starter shape that hits the anchors in
// PROJECT_BRIEF.md approximately (L2 = 100, L6 ≈ 1.5k, L30 ≈ 44k). Will be
// tuned in Sprint 2 alongside the XP award rules.

export const MAX_LEVEL = 30;

const TITLES: ReadonlyArray<{ maxLevel: number; title: string }> = [
  { maxLevel: 3, title: "Trainee Data Protection Officer" },
  { maxLevel: 7, title: "Data Protection Practitioner" },
  { maxLevel: 12, title: "Data Protection Specialist" },
  { maxLevel: 18, title: "Senior Data Protection Officer" },
  { maxLevel: 24, title: "Lead Data Protection Officer" },
  { maxLevel: MAX_LEVEL, title: "Chief Privacy Officer" },
];

export function titleForLevel(level: number): string {
  return (
    TITLES.find((t) => level <= t.maxLevel)?.title ??
    TITLES[TITLES.length - 1].title
  );
}

/** Cumulative XP needed to have reached `level`. */
export function xpForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, level));
  return Math.round(50 * clamped * (clamped - 1));
}

export type LevelProgress = {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  percent: number;
};

export function levelProgress(totalXp: number, level: number): LevelProgress {
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const xpIntoLevel = Math.max(0, totalXp - current);
  const xpNeededForLevel = Math.max(1, next - current);
  const percent = Math.min(
    100,
    Math.round((xpIntoLevel / xpNeededForLevel) * 100),
  );
  return {
    level,
    title: titleForLevel(level),
    xpIntoLevel,
    xpNeededForLevel,
    percent,
  };
}
