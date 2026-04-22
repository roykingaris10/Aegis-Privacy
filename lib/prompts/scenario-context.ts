// Shared scenario-context block injected into every coach prompt so the
// coach tailors its voice to the skill, tier, and client sector. Kept in
// one file so the shape is consistent across brief / hint / review.

import type { Scenario } from "@/lib/scenarios";
import type { Client } from "@/lib/clients";

const SKILL_LABELS: Record<string, string> = {
  sar_handling: "SAR Handling",
  foi_decisions: "FOI Decisions",
  dpia_authoring: "DPIA Authoring",
  breach_response: "Breach Response",
  international_transfers: "International Transfers",
  contract_vendor: "Contract & Vendor Management",
  pecr_marketing: "PECR & Marketing",
  childrens_data: "Children's Data",
  ai_governance: "AI Governance",
  regulator_liaison: "Regulator Liaison",
};

const TIER_LABELS: Record<1 | 2 | 3, string> = {
  1: "Tier I · Starter Client",
  2: "Tier II · Mid-Market Client",
  3: "Tier III · Enterprise Client",
};

export function scenarioContext(scenario: Scenario, client: Client): string {
  const skill = SKILL_LABELS[scenario.skill] ?? scenario.skill;
  const tier = TIER_LABELS[scenario.tier];
  return [
    `Scenario title: ${scenario.title}`,
    `Client: ${client.name} — ${client.sector}`,
    `Client regulatory overlay: ${client.regulatoryContext.join(", ")}`,
    `Skill: ${skill}`,
    `Tier: ${tier}`,
    `Difficulty: ${scenario.difficulty}`,
  ].join("\n");
}
