import { describe, expect, it } from "vitest";

import { requireScenarioById } from "@/lib/scenarios";
import { requireClientById } from "@/lib/clients";

import { COACH_PERSONA } from "./coach-persona";
import { buildBriefingPrompt } from "./briefing-prompt";
import { buildHintPrompt, HINT_MAX_DRAFT_CHARS } from "./hint-prompt";
import {
  REVIEW_MAX_USER_CHARS,
  buildReviewPrompt,
  reviewTool,
} from "./review-prompt";
import { scenarioContext } from "./scenario-context";

const scenario = requireScenarioById("scenario_001")!;
const client = requireClientById(scenario.client)!;

describe("COACH_PERSONA", () => {
  it("names Aegis Privacy Partners", () => {
    expect(COACH_PERSONA).toContain("Aegis Privacy Partners");
  });

  it("commits to UK/EU framing and British English", () => {
    expect(COACH_PERSONA).toContain("UK GDPR");
    expect(COACH_PERSONA).toContain("British English");
  });

  it("refuses US framings by name", () => {
    expect(COACH_PERSONA).toContain("CCPA");
    expect(COACH_PERSONA).toContain("HIPAA");
  });
});

describe("scenarioContext", () => {
  it("includes scenario, client, skill, tier, regulatory overlay", () => {
    const ctx = scenarioContext(scenario, client);
    expect(ctx).toContain(scenario.title);
    expect(ctx).toContain(client.name);
    expect(ctx).toContain("Tier I");
    expect(ctx).toContain("SAR Handling");
    expect(ctx).toContain(client.regulatoryContext[0]);
  });
});

describe("buildBriefingPrompt", () => {
  const prompt = buildBriefingPrompt(scenario, client);

  it("asks for 300-400 words in markdown", () => {
    expect(prompt).toMatch(/300–400 words/);
    expect(prompt).toContain("markdown");
  });

  it("embeds the raw briefing notes verbatim", () => {
    expect(prompt).toContain(scenario.briefing.requestType);
    expect(prompt).toContain(scenario.briefing.whatUserNeedsToKnow);
    expect(prompt).toContain(scenario.briefing.commonPitfalls);
  });

  it("forbids revealing the answer or the exemplar", () => {
    expect(prompt).toContain("Do NOT give them the answer");
    expect(prompt).toContain("Do not mention the exemplar");
  });
});

describe("buildHintPrompt", () => {
  it("renders the draft when present", () => {
    const prompt = buildHintPrompt(scenario, client, "I have started writing.");
    expect(prompt).toContain("I have started writing.");
    expect(prompt).not.toContain("(empty");
  });

  it("signposts an empty draft", () => {
    const prompt = buildHintPrompt(scenario, client, "");
    expect(prompt).toContain("(empty");
  });

  it("trims drafts longer than HINT_MAX_DRAFT_CHARS", () => {
    const huge = "x".repeat(HINT_MAX_DRAFT_CHARS + 500);
    const prompt = buildHintPrompt(scenario, client, huge);
    // The prompt is longer than the trimmed draft because it contains
    // framing text too, so we check the draft trim didn't exceed the cap.
    const draftBlock = prompt.split("Trainee's draft so far:\n")[1] ?? "";
    expect(draftBlock.length).toBeLessThanOrEqual(HINT_MAX_DRAFT_CHARS + 50);
  });

  it("caps at two sentences and bans exemplar leaking", () => {
    const prompt = buildHintPrompt(scenario, client, "");
    expect(prompt).toContain("Maximum two sentences");
    expect(prompt).toContain("Do NOT reference the exemplar");
  });
});

describe("buildReviewPrompt", () => {
  const userResponse = "My draft advice for Linda: ...";
  const prompt = buildReviewPrompt(scenario, client, userResponse);

  it("embeds the full rubric with maxPoints and description", () => {
    for (const row of scenario.rubric) {
      expect(prompt).toContain(row.criterion);
      expect(prompt).toContain(`max ${row.maxPoints} pts`);
      expect(prompt).toContain(row.description);
    }
  });

  it("includes the exemplar as the top-of-scale benchmark", () => {
    expect(prompt).toContain(scenario.exemplarResponse);
    expect(prompt).toContain("do not share or quote to the trainee");
  });

  it("trims user responses longer than REVIEW_MAX_USER_CHARS", () => {
    const over = "x".repeat(REVIEW_MAX_USER_CHARS + 1000);
    const built = buildReviewPrompt(scenario, client, over);
    const block = built.split("Trainee's response:\n")[1] ?? "";
    expect(block.length).toBeLessThanOrEqual(REVIEW_MAX_USER_CHARS + 50);
  });

  it("demands the tool_use call instead of free text", () => {
    expect(prompt).toContain("submit_review tool");
    expect(prompt).toContain("do not write any other output");
  });
});

describe("reviewTool", () => {
  const tool = reviewTool(scenario);
  const rubricProp = tool.input_schema.properties.rubricScores as {
    minItems: number;
    maxItems: number;
  };

  it("is named submit_review and enforces every rubric entry", () => {
    expect(tool.name).toBe("submit_review");
    expect(rubricProp.minItems).toBe(scenario.rubric.length);
    expect(rubricProp.maxItems).toBe(scenario.rubric.length);
  });

  it("requires all six top-level fields", () => {
    expect(tool.input_schema.required).toEqual([
      "overallScore",
      "rubricScores",
      "strengths",
      "gaps",
      "narrativeReview",
      "exemplarCommentary",
    ]);
  });
});
