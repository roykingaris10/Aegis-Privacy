import { describe, expect, it } from "vitest";

import {
  MAX_LEVEL,
  MAX_SKILL_LEVEL,
  calculateScenarioXp,
  calculateXpForLevel,
  getLevelForXp,
  getSkillLevelForXp,
  getSkillXpForLevel,
  getTitleForLevel,
  levelProgress,
} from "./xp";

// The brief anchors per-level deltas at 100 / 500 / 2000 XP for L1→2,
// L5→6, L12→13 respectively. Our curve (35 * n^1.5) is documented as
// approximate — within ~25% of each anchor is the fit target.
function within(actual: number, target: number, tolerance = 0.25): boolean {
  return Math.abs(actual - target) <= target * tolerance;
}

describe("calculateXpForLevel", () => {
  it("returns 0 for level 1 (no XP required to start)", () => {
    expect(calculateXpForLevel(1)).toBe(0);
  });

  it("approximately matches the brief's L1→2 = 100 XP anchor", () => {
    const delta = calculateXpForLevel(2) - calculateXpForLevel(1);
    expect(within(delta, 100)).toBe(true);
  });

  it("approximately matches the brief's L5→6 = 500 XP anchor", () => {
    const delta = calculateXpForLevel(6) - calculateXpForLevel(5);
    expect(within(delta, 500)).toBe(true);
  });

  it("approximately matches the brief's L12→13 = 2000 XP anchor", () => {
    const delta = calculateXpForLevel(13) - calculateXpForLevel(12);
    expect(within(delta, 2000)).toBe(true);
  });

  it("is monotonically increasing across all levels 1 to MAX_LEVEL", () => {
    for (let l = 1; l < MAX_LEVEL; l++) {
      expect(calculateXpForLevel(l + 1)).toBeGreaterThan(
        calculateXpForLevel(l),
      );
    }
  });

  it("clamps levels above MAX_LEVEL to the MAX_LEVEL cumulative total", () => {
    expect(calculateXpForLevel(MAX_LEVEL + 5)).toBe(
      calculateXpForLevel(MAX_LEVEL),
    );
  });

  it("throws on non-finite or sub-1 levels", () => {
    expect(() => calculateXpForLevel(0)).toThrow();
    expect(() => calculateXpForLevel(-3)).toThrow();
    expect(() => calculateXpForLevel(Number.NaN)).toThrow();
  });
});

describe("getLevelForXp", () => {
  it("returns 1 at 0 XP", () => {
    expect(getLevelForXp(0)).toBe(1);
  });

  it("returns 1 just below the L2 threshold", () => {
    expect(getLevelForXp(calculateXpForLevel(2) - 1)).toBe(1);
  });

  it("returns 2 exactly at the L2 threshold", () => {
    expect(getLevelForXp(calculateXpForLevel(2))).toBe(2);
  });

  it("caps at MAX_LEVEL even for astronomical XP", () => {
    expect(getLevelForXp(10_000_000)).toBe(MAX_LEVEL);
  });

  it("is consistent with calculateXpForLevel across every level", () => {
    for (let l = 1; l <= MAX_LEVEL; l++) {
      expect(getLevelForXp(calculateXpForLevel(l))).toBe(l);
    }
  });

  it("throws on negative or non-finite XP", () => {
    expect(() => getLevelForXp(-1)).toThrow();
    expect(() => getLevelForXp(Number.NaN)).toThrow();
  });
});

describe("getTitleForLevel", () => {
  it("maps the brief's rank bands correctly", () => {
    expect(getTitleForLevel(1)).toBe("Trainee Data Protection Officer");
    expect(getTitleForLevel(3)).toBe("Trainee Data Protection Officer");
    expect(getTitleForLevel(4)).toBe("Data Protection Practitioner");
    expect(getTitleForLevel(7)).toBe("Data Protection Practitioner");
    expect(getTitleForLevel(8)).toBe("Data Protection Specialist");
    expect(getTitleForLevel(12)).toBe("Data Protection Specialist");
    expect(getTitleForLevel(13)).toBe("Senior Data Protection Officer");
    expect(getTitleForLevel(18)).toBe("Senior Data Protection Officer");
    expect(getTitleForLevel(19)).toBe("Lead Data Protection Officer");
    expect(getTitleForLevel(24)).toBe("Lead Data Protection Officer");
    expect(getTitleForLevel(25)).toBe("Chief Privacy Officer");
    expect(getTitleForLevel(MAX_LEVEL)).toBe("Chief Privacy Officer");
  });
});

describe("levelProgress", () => {
  it("reports 0% at the start of a level", () => {
    const p = levelProgress(calculateXpForLevel(3), 3);
    expect(p.level).toBe(3);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.percent).toBe(0);
  });

  it("reports 100% at MAX_LEVEL and never overflows", () => {
    const p = levelProgress(1_000_000);
    expect(p.level).toBe(MAX_LEVEL);
    expect(p.percent).toBe(100);
  });

  it("derives level from XP when not supplied", () => {
    const xp = calculateXpForLevel(5) + 10;
    const p = levelProgress(xp);
    expect(p.level).toBe(5);
    expect(p.xpIntoLevel).toBe(10);
  });
});

describe("skill curves", () => {
  it("returns 0 skill XP for level 0", () => {
    expect(getSkillXpForLevel(0)).toBe(0);
  });

  it("is monotonically increasing up to MAX_SKILL_LEVEL", () => {
    for (let l = 0; l < MAX_SKILL_LEVEL; l++) {
      expect(getSkillXpForLevel(l + 1)).toBeGreaterThan(getSkillXpForLevel(l));
    }
  });

  it("getSkillLevelForXp is consistent with getSkillXpForLevel", () => {
    for (let l = 0; l <= MAX_SKILL_LEVEL; l++) {
      expect(getSkillLevelForXp(getSkillXpForLevel(l))).toBe(l);
    }
  });

  it("caps skill level at MAX_SKILL_LEVEL", () => {
    expect(getSkillLevelForXp(10_000_000)).toBe(MAX_SKILL_LEVEL);
  });

  it("throws on negative XP", () => {
    expect(() => getSkillXpForLevel(-1)).toThrow();
    expect(() => getSkillLevelForXp(-1)).toThrow();
  });
});

describe("calculateScenarioXp", () => {
  it("applies the 0.5× quality floor at 0% score", () => {
    const r = calculateScenarioXp({
      xpBase: 100,
      qualityScore: 0,
      streak: 0,
      isFirstTime: false,
    });
    expect(r.qualityMultiplier).toBe(0.5);
    expect(r.total).toBe(50);
  });

  it("applies the 1.5× quality ceiling at 100% with the +50 perfect bonus", () => {
    const r = calculateScenarioXp({
      xpBase: 100,
      qualityScore: 100,
      streak: 0,
      isFirstTime: false,
    });
    expect(r.qualityMultiplier).toBe(1.5);
    expect(r.perfectScoreBonus).toBe(50);
    expect(r.total).toBe(200);
  });

  it("applies streak multiplier up to +50% at 30 days", () => {
    const r = calculateScenarioXp({
      xpBase: 100,
      qualityScore: 50,
      streak: 30,
      isFirstTime: false,
    });
    expect(r.streakMultiplier).toBe(1.5);
    expect(r.total).toBe(150);
  });

  it("caps streak multiplier beyond 30 days", () => {
    const r = calculateScenarioXp({
      xpBase: 100,
      qualityScore: 50,
      streak: 100,
      isFirstTime: false,
    });
    expect(r.streakMultiplier).toBe(1.5);
  });

  it("applies a 1.25× first-time bonus", () => {
    const base = calculateScenarioXp({
      xpBase: 100,
      qualityScore: 75,
      streak: 0,
      isFirstTime: false,
    });
    const first = calculateScenarioXp({
      xpBase: 100,
      qualityScore: 75,
      streak: 0,
      isFirstTime: true,
    });
    expect(first.total).toBe(Math.round(base.total * 1.25));
  });

  it("composes all multipliers and the perfect bonus", () => {
    // xpBase 200, quality 100 → 1.5×, streak 30 → 1.5×, first-time 1.25×
    // 200 * 1.5 * 1.5 * 1.25 = 562.5 → 563 (rounded) + 50 perfect = 613
    const r = calculateScenarioXp({
      xpBase: 200,
      qualityScore: 100,
      streak: 30,
      isFirstTime: true,
    });
    expect(r.total).toBe(613);
  });

  it("rejects quality scores outside 0–100", () => {
    expect(() =>
      calculateScenarioXp({
        xpBase: 100,
        qualityScore: -1,
        streak: 0,
        isFirstTime: false,
      }),
    ).toThrow();
    expect(() =>
      calculateScenarioXp({
        xpBase: 100,
        qualityScore: 101,
        streak: 0,
        isFirstTime: false,
      }),
    ).toThrow();
  });

  it("rejects negative xpBase or streak", () => {
    expect(() =>
      calculateScenarioXp({
        xpBase: -1,
        qualityScore: 75,
        streak: 0,
        isFirstTime: false,
      }),
    ).toThrow();
    expect(() =>
      calculateScenarioXp({
        xpBase: 100,
        qualityScore: 75,
        streak: -1,
        isFirstTime: false,
      }),
    ).toThrow();
  });
});
