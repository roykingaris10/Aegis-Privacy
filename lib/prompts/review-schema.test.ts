import { describe, expect, it } from "vitest";

import { requireScenarioById } from "@/lib/scenarios";
import { ReviewSchema, buildFallbackReview } from "./review-schema";

const scenario = requireScenarioById("scenario_001")!;

function validReview() {
  const rubricScores = scenario.rubric.map((r) => ({
    criterion: r.criterion,
    score: Math.round(r.maxPoints * 0.8),
    maxPoints: r.maxPoints,
    commentary: "Specific commentary on the trainee's answer.",
  }));
  const overallScore = rubricScores.reduce((s, r) => s + r.score, 0);
  return {
    overallScore,
    rubricScores,
    strengths: ["Clear verification step", "Correct statutory clock"],
    gaps: ["Missed Sch 3 Part 5", "Didn't address scope narrowing"],
    narrativeReview: "You showed strong structure. ...",
    exemplarCommentary: "The exemplar differs by ...",
  };
}

describe("ReviewSchema", () => {
  it("accepts a well-formed review", () => {
    const res = ReviewSchema.safeParse(validReview());
    expect(res.success).toBe(true);
  });

  it.each([
    "overallScore",
    "rubricScores",
    "strengths",
    "gaps",
    "narrativeReview",
    "exemplarCommentary",
  ] as const)("rejects missing field %s", (field) => {
    const r = validReview() as Record<string, unknown>;
    delete r[field];
    expect(ReviewSchema.safeParse(r).success).toBe(false);
  });

  it("rejects overallScore above 100", () => {
    const r = { ...validReview(), overallScore: 150 };
    expect(ReviewSchema.safeParse(r).success).toBe(false);
  });

  it("rejects negative overallScore", () => {
    const r = { ...validReview(), overallScore: -5 };
    expect(ReviewSchema.safeParse(r).success).toBe(false);
  });

  it("rejects non-integer scores", () => {
    const r = validReview();
    r.rubricScores[0].score = 12.5;
    expect(ReviewSchema.safeParse(r).success).toBe(false);
  });

  it("rejects empty rubricScores", () => {
    const r = { ...validReview(), rubricScores: [] };
    expect(ReviewSchema.safeParse(r).success).toBe(false);
  });

  it("rejects empty narrative or exemplar commentary", () => {
    const r1 = { ...validReview(), narrativeReview: "" };
    const r2 = { ...validReview(), exemplarCommentary: "" };
    expect(ReviewSchema.safeParse(r1).success).toBe(false);
    expect(ReviewSchema.safeParse(r2).success).toBe(false);
  });

  it("rejects non-array strengths/gaps", () => {
    const r1 = { ...validReview(), strengths: "good" };
    expect(ReviewSchema.safeParse(r1).success).toBe(false);
  });

  it("rejects entirely malformed payloads", () => {
    expect(ReviewSchema.safeParse(null).success).toBe(false);
    expect(ReviewSchema.safeParse(undefined).success).toBe(false);
    expect(ReviewSchema.safeParse("a string").success).toBe(false);
    expect(ReviewSchema.safeParse(42).success).toBe(false);
  });
});

describe("buildFallbackReview", () => {
  it("produces a schema-valid fallback for the scenario", () => {
    const fb = buildFallbackReview(scenario);
    const res = ReviewSchema.safeParse(fb);
    expect(res.success).toBe(true);
  });

  it("mirrors every rubric criterion exactly", () => {
    const fb = buildFallbackReview(scenario);
    expect(fb.rubricScores.map((r) => r.criterion)).toEqual(
      scenario.rubric.map((r) => r.criterion),
    );
  });
});
