// Zod mirror of the review tool's JSON schema. Used to validate Claude's
// tool-use arguments before we trust them. A soft fallback is produced
// from the scenario's own rubric so we always have something to show if
// the model output can't be parsed on the second attempt.

import { z } from "zod";
import type { Scenario } from "@/lib/scenarios";

export const ReviewSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  rubricScores: z
    .array(
      z.object({
        criterion: z.string().min(1),
        score: z.number().int().min(0),
        maxPoints: z.number().int().min(1),
        commentary: z.string().min(1),
      }),
    )
    .min(1),
  strengths: z.array(z.string().min(1)).min(1),
  gaps: z.array(z.string().min(1)).min(1),
  narrativeReview: z.string().min(1),
  exemplarCommentary: z.string().min(1),
});

export type Review = z.infer<typeof ReviewSchema>;

export function buildFallbackReview(scenario: Scenario): Review {
  const rubricScores = scenario.rubric.map((r) => ({
    criterion: r.criterion,
    score: Math.round(r.maxPoints * 0.5),
    maxPoints: r.maxPoints,
    commentary:
      "The coach couldn't generate structured feedback for this criterion. This is a fallback entry — your response has been saved and you can re-submit to get a fresh review.",
  }));
  const overallScore = rubricScores.reduce((s, r) => s + r.score, 0);
  return {
    overallScore,
    rubricScores,
    strengths: [
      "Your response has been saved.",
      "You submitted a complete answer and used the editor correctly.",
    ],
    gaps: [
      "The coach's structured feedback could not be generated this time.",
      "Try re-submitting in a few minutes; the API may have been temporarily unreachable.",
    ],
    narrativeReview:
      "The coach wasn't able to produce a structured review this time. Your response has been saved and your XP awarded against a placeholder 50% score. Submit again to get a proper review — there was no fault in your response.",
    exemplarCommentary:
      "Exemplar comparison is unavailable for this attempt. Your saved response will be re-scored automatically on re-submission.",
  };
}
