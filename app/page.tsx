import * as React from "react";

import { LevelBanner } from "@/components/dashboard/level-banner";
import { StreakCounter } from "@/components/dashboard/streak-counter";
import { SkillRadarChart } from "@/components/dashboard/skill-radar-chart";
import {
  TodaysInbox,
  type InboxScenario,
} from "@/components/dashboard/todays-inbox";
import { RecentAchievements } from "@/components/dashboard/recent-achievements";
import { WeeklyChallenge } from "@/components/dashboard/weekly-challenge";
import { emptySkillProgress } from "@/lib/skills";

// MOCK DATA — will be replaced with DB reads in Sprint 2.
const MOCK = {
  user: { level: 1, totalXp: 0, currentStreak: 0, longestStreak: 0 },
  skillProgress: emptySkillProgress(),
  achievements: [] as never[],
  scenarios: [
    {
      id: "scenario_001",
      client: "Bramble Lane Primary School",
      clientInitial: "BL",
      subject: "Parent request for Year 3 pupil records",
      preview:
        "A parent has asked for a copy of all information the school holds about their child. Please advise on scope, identity verification, and deadline.",
      tier: 1,
      skillLabel: "SAR Handling",
      xpReward: 50,
      deadlineLabel: "Due in 28 days",
    },
    {
      id: "scenario_stub_2",
      client: "Fernwood Dental Practice",
      clientInitial: "FD",
      subject: "Email sent to wrong patient",
      preview:
        "A clinician emailed treatment details to the wrong patient this morning. Triage whether this is a reportable breach.",
      tier: 1,
      skillLabel: "Breach Response",
      xpReward: 50,
      deadlineLabel: "72-hour clock",
    },
    {
      id: "scenario_002",
      client: "Hartwell Borough Council",
      clientInitial: "HC",
      subject: "FOI: Highways contract spend 2023–25",
      preview:
        "Journalist has requested contract values and supplier names. Consider s.43 commercial interests and the public-interest test.",
      tier: 2,
      skillLabel: "FOI Decisions",
      xpReward: 100,
      deadlineLabel: "Due in 14 days",
    },
    {
      id: "scenario_003",
      client: "Meridian Capital Partners",
      clientInitial: "MC",
      subject: "US vendor accessing investor KYC records",
      preview:
        "Operations want to onboard a US-based analytics vendor. Advise on transfer mechanism post-adequacy, TIA, and SCC module.",
      tier: 3,
      skillLabel: "International Transfers",
      xpReward: 200,
      deadlineLabel: "Due in 7 days",
    },
  ] as const satisfies ReadonlyArray<InboxScenario>,
};

export default function DashboardPage(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <LevelBanner totalXp={MOCK.user.totalXp} level={MOCK.user.level} />

      <div className="grid gap-4 md:grid-cols-3">
        <StreakCounter
          currentStreak={MOCK.user.currentStreak}
          longestStreak={MOCK.user.longestStreak}
        />
        <div className="md:col-span-2">
          <SkillRadarChart skillProgress={MOCK.skillProgress} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <TodaysInbox scenarios={MOCK.scenarios} />
        </div>
        <RecentAchievements achievements={MOCK.achievements} />
      </div>

      <WeeklyChallenge
        title="Breach Week"
        description="Themed week focused on breach triage and 72-hour notification decisions."
        status="coming_soon"
      />
    </div>
  );
}
