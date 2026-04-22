// Weekly challenge rotation. The rotation is deterministic from the
// ISO week number so the challenge is the same for everyone and changes
// on Mondays in UTC. Skills cycle through a curated order so each theme
// lands at a sensible cadence (every ~10 weeks).

import { SKILLS, type SkillKey } from "@/lib/skills";

const ROTATION: SkillKey[] = [
  "breach_response",
  "sar_handling",
  "foi_decisions",
  "international_transfers",
  "dpia_authoring",
  "contract_vendor",
  "pecr_marketing",
  "childrens_data",
  "ai_governance",
  "regulator_liaison",
];

const THEME_BLURB: Record<SkillKey, string> = {
  breach_response:
    "Breach week — breach-response scenarios pay 2× XP until Sunday.",
  sar_handling:
    "SAR week — subject access request scenarios pay 2× XP until Sunday.",
  foi_decisions:
    "FOI week — Freedom-of-Information decisions pay 2× XP until Sunday.",
  international_transfers:
    "Transfer week — international-transfer scenarios pay 2× XP until Sunday.",
  dpia_authoring:
    "DPIA week — impact-assessment scenarios pay 2× XP until Sunday.",
  contract_vendor:
    "Contracts week — vendor and processor scenarios pay 2× XP until Sunday.",
  pecr_marketing: "PECR week — marketing and cookies pay 2× XP until Sunday.",
  childrens_data:
    "Children's Data week — age assurance and DUAA pay 2× XP until Sunday.",
  ai_governance:
    "AI Governance week — Article 22 and EU AI Act scenarios pay 2× XP.",
  regulator_liaison:
    "Regulator week — ICO, court orders, police requests pay 2× XP.",
};

export function isoWeekNumber(date: Date = new Date()): number {
  // ISO 8601 week number algorithm.
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export type WeeklyChallenge = {
  weekNumber: number;
  skill: SkillKey;
  title: string;
  description: string;
};

export function getWeeklyChallenge(now: Date = new Date()): WeeklyChallenge {
  const week = isoWeekNumber(now);
  const skill = ROTATION[week % ROTATION.length];
  const label = SKILLS.find((s) => s.key === skill)?.label ?? skill;
  return {
    weekNumber: week,
    skill,
    title: `${label} week`,
    description: THEME_BLURB[skill],
  };
}
