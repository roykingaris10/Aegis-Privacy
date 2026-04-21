// The ten skill trees. Order is stable — the radar chart axes follow this list.

export type SkillKey =
  | "sar_handling"
  | "foi_decisions"
  | "dpia_authoring"
  | "breach_response"
  | "international_transfers"
  | "contract_vendor"
  | "pecr_marketing"
  | "childrens_data"
  | "ai_governance"
  | "regulator_liaison";

export type Skill = {
  key: SkillKey;
  label: string;
  short: string;
};

export const SKILLS: ReadonlyArray<Skill> = [
  { key: "sar_handling", label: "SAR Handling", short: "SAR" },
  { key: "foi_decisions", label: "FOI Decisions", short: "FOI" },
  { key: "dpia_authoring", label: "DPIA Authoring", short: "DPIA" },
  { key: "breach_response", label: "Breach Response", short: "Breach" },
  {
    key: "international_transfers",
    label: "International Transfers",
    short: "Transfers",
  },
  { key: "contract_vendor", label: "Contract & Vendor", short: "Contracts" },
  { key: "pecr_marketing", label: "PECR & Marketing", short: "PECR" },
  { key: "childrens_data", label: "Children's Data", short: "Children" },
  { key: "ai_governance", label: "AI Governance", short: "AI Gov" },
  { key: "regulator_liaison", label: "Regulator Liaison", short: "Regulator" },
];

export const MAX_SKILL_LEVEL = 10;

export type SkillProgress = Record<SkillKey, { level: number; xp: number }>;

export function emptySkillProgress(): SkillProgress {
  return SKILLS.reduce((acc, s) => {
    acc[s.key] = { level: 0, xp: 0 };
    return acc;
  }, {} as SkillProgress);
}
