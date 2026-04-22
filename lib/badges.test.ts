import { describe, expect, it } from "vitest";

import {
  BADGES,
  newlyAwardedBadges,
  qualifyingBadges,
  type CompletionSummary,
  type UserStats,
} from "./badges";
import type { SkillKey } from "./skills";

const baseStats = (overrides: Partial<UserStats> = {}): UserStats => ({
  level: 1,
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  skillLevels: {},
  skillsCompleted: new Set(),
  completions: [],
  viewedAnyGuide: false,
  ...overrides,
});

const completion = (
  over: Partial<CompletionSummary> = {},
): CompletionSummary => ({
  scenarioId: "scenario_001",
  tier: 1,
  skill: "sar_handling",
  difficulty: "straightforward",
  score: 75,
  rubric: [
    { criterion: "a", score: 10, maxPoints: 20 },
    { criterion: "b", score: 10, maxPoints: 20 },
  ],
  ...over,
});

describe("badge registry shape", () => {
  it("has 15 badges", () => {
    expect(BADGES).toHaveLength(15);
  });
  it("has unique ids", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("assigns a rarity to every badge", () => {
    for (const b of BADGES) {
      expect(["common", "uncommon", "rare", "legendary"]).toContain(b.rarity);
    }
  });
});

describe("criteria: trigger on match, not on non-match", () => {
  it("first_blood triggers after the first completion", () => {
    const empty = baseStats();
    const one = baseStats({ completions: [completion()] });
    expect(qualifyingBadges(empty)).not.toContain("first_blood");
    expect(qualifyingBadges(one)).toContain("first_blood");
  });

  it("getting_started requires Level 2", () => {
    expect(qualifyingBadges(baseStats({ level: 1 }))).not.toContain(
      "getting_started",
    );
    expect(qualifyingBadges(baseStats({ level: 2 }))).toContain(
      "getting_started",
    );
  });

  it("streak_beginner triggers at 3-day streak (current or longest)", () => {
    expect(
      qualifyingBadges(baseStats({ currentStreak: 2, longestStreak: 2 })),
    ).not.toContain("streak_beginner");
    expect(qualifyingBadges(baseStats({ currentStreak: 3 }))).toContain(
      "streak_beginner",
    );
    expect(
      qualifyingBadges(baseStats({ longestStreak: 3, currentStreak: 0 })),
    ).toContain("streak_beginner");
  });

  it("perfect_score requires a 100-point completion", () => {
    expect(
      qualifyingBadges(baseStats({ completions: [completion({ score: 99 })] })),
    ).not.toContain("perfect_score");
    expect(
      qualifyingBadges(
        baseStats({ completions: [completion({ score: 100 })] }),
      ),
    ).toContain("perfect_score");
  });

  it("tier_climber requires a Tier II completion", () => {
    expect(
      qualifyingBadges(baseStats({ completions: [completion({ tier: 1 })] })),
    ).not.toContain("tier_climber");
    expect(
      qualifyingBadges(baseStats({ completions: [completion({ tier: 2 })] })),
    ).toContain("tier_climber");
  });

  it("skill_starter requires a skill at level 3+", () => {
    expect(
      qualifyingBadges(baseStats({ skillLevels: { sar_handling: 2 } })),
    ).not.toContain("skill_starter");
    expect(
      qualifyingBadges(baseStats({ skillLevels: { foi_decisions: 3 } })),
    ).toContain("skill_starter");
  });

  it("streak_keeper requires 7-day streak", () => {
    expect(qualifyingBadges(baseStats({ currentStreak: 6 }))).not.toContain(
      "streak_keeper",
    );
    expect(qualifyingBadges(baseStats({ currentStreak: 7 }))).toContain(
      "streak_keeper",
    );
  });

  it("all_rounder needs 5 distinct skills completed", () => {
    expect(
      qualifyingBadges(
        baseStats({
          skillsCompleted: new Set<SkillKey>([
            "sar_handling",
            "foi_decisions",
            "dpia_authoring",
            "breach_response",
          ]),
        }),
      ),
    ).not.toContain("all_rounder");
    expect(
      qualifyingBadges(
        baseStats({
          skillsCompleted: new Set<SkillKey>([
            "sar_handling",
            "foi_decisions",
            "dpia_authoring",
            "breach_response",
            "international_transfers",
          ]),
        }),
      ),
    ).toContain("all_rounder");
  });

  it("no_stone_unturned requires a complex SAR with every criterion > 0", () => {
    const zero = completion({
      skill: "sar_handling",
      difficulty: "complex",
      rubric: [
        { criterion: "a", score: 10, maxPoints: 20 },
        { criterion: "b", score: 0, maxPoints: 20 },
      ],
    });
    const all = completion({
      skill: "sar_handling",
      difficulty: "complex",
      rubric: [
        { criterion: "a", score: 5, maxPoints: 20 },
        { criterion: "b", score: 3, maxPoints: 20 },
        { criterion: "c", score: 1, maxPoints: 15 },
      ],
    });
    expect(qualifyingBadges(baseStats({ completions: [zero] }))).not.toContain(
      "no_stone_unturned",
    );
    expect(qualifyingBadges(baseStats({ completions: [all] }))).toContain(
      "no_stone_unturned",
    );
  });

  it("firefighter requires breach_response at score >= 85", () => {
    expect(
      qualifyingBadges(
        baseStats({
          completions: [completion({ skill: "breach_response", score: 84 })],
        }),
      ),
    ).not.toContain("firefighter");
    expect(
      qualifyingBadges(
        baseStats({
          completions: [completion({ skill: "breach_response", score: 85 })],
        }),
      ),
    ).toContain("firefighter");
  });

  it("tier_3_unlocked requires Level 13", () => {
    expect(qualifyingBadges(baseStats({ level: 12 }))).not.toContain(
      "tier_3_unlocked",
    );
    expect(qualifyingBadges(baseStats({ level: 13 }))).toContain(
      "tier_3_unlocked",
    );
  });

  it("streak_master requires 30-day streak", () => {
    expect(qualifyingBadges(baseStats({ currentStreak: 29 }))).not.toContain(
      "streak_master",
    );
    expect(qualifyingBadges(baseStats({ currentStreak: 30 }))).toContain(
      "streak_master",
    );
  });

  it("polymath requires Level 5+ in all 10 skills", () => {
    const nine = baseStats({
      skillLevels: {
        sar_handling: 5,
        foi_decisions: 5,
        dpia_authoring: 5,
        breach_response: 5,
        international_transfers: 5,
        contract_vendor: 5,
        pecr_marketing: 5,
        childrens_data: 5,
        ai_governance: 5,
      },
    });
    expect(qualifyingBadges(nine)).not.toContain("polymath");

    const ten = baseStats({
      skillLevels: {
        sar_handling: 5,
        foi_decisions: 5,
        dpia_authoring: 5,
        breach_response: 5,
        international_transfers: 5,
        contract_vendor: 5,
        pecr_marketing: 5,
        childrens_data: 5,
        ai_governance: 5,
        regulator_liaison: 5,
      },
    });
    expect(qualifyingBadges(ten)).toContain("polymath");
  });
});

describe("newlyAwardedBadges", () => {
  it("does not re-award badges the user already holds", () => {
    const stats = baseStats({
      level: 2,
      completions: [completion()],
    });
    const all = qualifyingBadges(stats);
    expect(all).toContain("first_blood");
    expect(all).toContain("getting_started");

    const alreadyHave = ["first_blood"];
    const newly = newlyAwardedBadges(stats, alreadyHave).map((b) => b.id);
    expect(newly).not.toContain("first_blood");
    expect(newly).toContain("getting_started");
  });
});
