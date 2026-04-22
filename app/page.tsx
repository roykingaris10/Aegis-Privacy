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

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getAllScenarios } from "@/lib/scenarios";
import { requireClientById } from "@/lib/clients";
import { emptySkillProgress, SKILLS, type SkillKey } from "@/lib/skills";

export const dynamic = "force-dynamic";

function coerceSkillProgress(raw: unknown) {
  const base = emptySkillProgress();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const map = raw as Record<string, { level?: number; xp?: number }>;
  for (const skill of SKILLS) {
    const entry = map[skill.key];
    if (
      entry &&
      typeof entry.level === "number" &&
      typeof entry.xp === "number"
    ) {
      base[skill.key] = { level: entry.level, xp: entry.xp };
    }
  }
  return base;
}

function coerceBadges(raw: unknown): string[] {
  return Array.isArray(raw)
    ? (raw.filter((b) => typeof b === "string") as string[])
    : [];
}

function humanSkill(s: SkillKey): string {
  return s
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function deadlineLabelFor(tier: 1 | 2 | 3): string {
  if (tier === 1) return "Due in 28 days";
  if (tier === 2) return "Due in 14 days";
  return "Due in 7 days";
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  // Scenarios for the "Today's inbox" preview — first 4 from the YAML loader
  // joined with client data. Completed scenarios are deprioritised.
  const completions = await prisma.scenarioCompletion.findMany({
    where: { userId: user.id },
    select: { scenarioId: true },
  });
  const completedIds = new Set(completions.map((c) => c.scenarioId));

  const inbox: InboxScenario[] = getAllScenarios()
    .filter((s) => !completedIds.has(s.id))
    .slice(0, 4)
    .map((s) => {
      const client = requireClientById(s.client);
      return {
        id: s.id,
        client: client.name,
        clientInitial: client.logoInitials,
        subject: s.emailSubject,
        preview: s.briefing.requestType,
        tier: s.tier,
        skillLabel: humanSkill(s.skill),
        xpReward: s.xpBase,
        deadlineLabel: deadlineLabelFor(s.tier),
      };
    });

  const skillProgress = coerceSkillProgress(user.skillProgress);
  const badges = coerceBadges(user.badges);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <LevelBanner totalXp={user.totalXp} level={user.level} />

      <div className="grid gap-4 md:grid-cols-3">
        <StreakCounter
          currentStreak={user.currentStreak}
          longestStreak={user.longestStreak}
        />
        <div className="md:col-span-2">
          <SkillRadarChart skillProgress={skillProgress} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <TodaysInbox scenarios={inbox} />
        </div>
        <RecentAchievements
          achievements={badges.map((b) => ({
            id: b,
            name: b,
            earnedAtLabel: "",
          }))}
        />
      </div>

      <WeeklyChallenge
        title="Breach Week"
        description="Themed week focused on breach triage and 72-hour notification decisions."
        status="coming_soon"
      />
    </div>
  );
}
