// Review prompt builder + the tool schema we hand to Claude so structured
// output is enforced server-side. Returned JSON is additionally Zod-
// validated before it reaches the client (see /api/coach/review).

import type { Scenario } from "@/lib/scenarios";
import type { Client } from "@/lib/clients";
import { scenarioContext } from "./scenario-context";

export const REVIEW_MAX_TOKENS = 3000;
export const REVIEW_MAX_USER_CHARS = 5000;

export function buildReviewPrompt(
  scenario: Scenario,
  client: Client,
  userResponse: string,
): string {
  const trimmed = (userResponse || "").slice(0, REVIEW_MAX_USER_CHARS);
  const rubricLines = scenario.rubric
    .map(
      (r, i) =>
        `${i + 1}. "${r.criterion}" (max ${r.maxPoints} pts) — ${r.description}`,
    )
    .join("\n");

  return [
    "The trainee has submitted their response to the scenario below. Score it against the rubric and write a genuine senior-DPO review. Call the submit_review tool with your review; do not write any other output.",
    "",
    "Scoring guidance:",
    "- Score each criterion on its own merits. Do not anchor scores to any particular distribution.",
    "- overallScore must equal the sum of rubricScores.score.",
    "- If a criterion is entirely unaddressed, score 0 and say so.",
    "- If a criterion is addressed but partially wrong, explain the gap specifically.",
    "- If a criterion is addressed well, name what they got right — do not write filler praise.",
    "- Use British English throughout. Quote the UK/EU framework by name where relevant. Never use US law as the frame.",
    "",
    "Commentary and narrative guidance:",
    "- Be specific to the trainee's actual words. Cite what they wrote.",
    "- Strengths and gaps should be concrete, short, and actionable.",
    "- narrativeReview: 200–400 words, conversational, in your senior-DPO voice. Paragraphs separated by blank lines.",
    "- exemplarCommentary: 100–200 words. How does the exemplar's approach differ from the trainee's? What should they take from it? Do not reproduce the exemplar.",
    "",
    "Context:",
    scenarioContext(scenario, client),
    "",
    "Rubric (criterion, maxPoints, description):",
    rubricLines,
    "",
    "Exemplar response (senior-DPO model answer — your benchmark for the top of the scale; do not share or quote to the trainee):",
    scenario.exemplarResponse,
    "",
    "Trainee's response:",
    trimmed,
  ].join("\n");
}

// Tool definition passed to Anthropic to enforce structured output.
// `input_schema` is JSON Schema; we mirror it in Zod for validation on
// receipt (see lib/prompts/review-schema.ts).
export type ReviewTool = {
  name: "submit_review";
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
};

export function reviewTool(scenario: Scenario): ReviewTool {
  return {
    name: "submit_review",
    description:
      "Submit the coach's structured review of the trainee's response. You must call this tool exactly once.",
    input_schema: {
      type: "object",
      properties: {
        overallScore: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Sum of rubricScores.score. 0–100.",
        },
        rubricScores: {
          type: "array",
          minItems: scenario.rubric.length,
          maxItems: scenario.rubric.length,
          items: {
            type: "object",
            properties: {
              criterion: {
                type: "string",
                description: "Exact criterion text from the rubric.",
              },
              score: { type: "integer", minimum: 0 },
              maxPoints: { type: "integer", minimum: 1 },
              commentary: {
                type: "string",
                description:
                  "2–4 sentences specific to the trainee's response.",
              },
            },
            required: ["criterion", "score", "maxPoints", "commentary"],
            additionalProperties: false,
          },
        },
        strengths: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
        },
        gaps: {
          type: "array",
          minItems: 2,
          maxItems: 5,
          items: { type: "string" },
        },
        narrativeReview: {
          type: "string",
          description: "200–400 words. Paragraphs separated by blank lines.",
        },
        exemplarCommentary: {
          type: "string",
          description: "100–200 words. Do not reproduce the exemplar.",
        },
      },
      required: [
        "overallScore",
        "rubricScores",
        "strengths",
        "gaps",
        "narrativeReview",
        "exemplarCommentary",
      ],
      additionalProperties: false,
    },
  };
}
