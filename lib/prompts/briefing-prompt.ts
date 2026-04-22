import type { Scenario } from "@/lib/scenarios";
import type { Client } from "@/lib/clients";
import { scenarioContext } from "./scenario-context";

export const BRIEFING_MAX_TOKENS = 1200;

export function buildBriefingPrompt(
  scenario: Scenario,
  client: Client,
): string {
  return [
    "The trainee is about to draft their response to the scenario below. Brief them, in your voice, so they know the shape of the problem, the law that governs it, the decision framework they should apply, and the common pitfalls to avoid.",
    "",
    "Constraints:",
    "- 300–400 words. Do not pad.",
    "- Use markdown: short ## sections and bullet lists where they help. Do not use numbered headings.",
    "- Do NOT give them the answer. Do not mention the exemplar. Close with a single open question the trainee should be asking themselves before they start writing.",
    "",
    "Context:",
    scenarioContext(scenario, client),
    "",
    "Raw briefing notes (your own, from your case file — paraphrase into your voice, do not just reproduce):",
    "",
    "Request type:",
    scenario.briefing.requestType,
    "",
    "What the trainee needs to know:",
    scenario.briefing.whatUserNeedsToKnow,
    "",
    "Common pitfalls:",
    scenario.briefing.commonPitfalls,
  ].join("\n");
}
