import type { Scenario } from "@/lib/scenarios";
import type { Client } from "@/lib/clients";
import { scenarioContext } from "./scenario-context";

export const HINT_MAX_TOKENS = 200;
export const HINT_MAX_DRAFT_CHARS = 4000;

export function buildHintPrompt(
  scenario: Scenario,
  client: Client,
  currentDraft: string,
): string {
  const draft = (currentDraft || "").slice(0, HINT_MAX_DRAFT_CHARS).trim();

  return [
    "The trainee is stuck on the scenario below. Give them ONE Socratic hint — a single short question that points them toward what they are missing, based on what they have written so far.",
    "",
    "Constraints:",
    "- Maximum two sentences.",
    "- Do NOT give the answer.",
    "- Do NOT reference the exemplar.",
    "- Ask about one specific thing they have not yet addressed. If the draft is empty, ask the question that would unblock them to start.",
    "",
    "Context:",
    scenarioContext(scenario, client),
    "",
    "Framework they should be using (for your reference, not to quote back):",
    scenario.briefing.whatUserNeedsToKnow,
    "",
    "Trainee's draft so far:",
    draft.length > 0 ? draft : "(empty — they have not yet started writing)",
  ].join("\n");
}
