import * as React from "react";
import { redirect } from "next/navigation";

import { LevelBanner } from "@/components/dashboard/level-banner";
import { StreakCounter } from "@/components/dashboard/streak-counter";
import { SkillRadarChart } from "@/components/dashboard/skill-radar-chart";
import {
  TodaysInbox,
  type InboxScenario,
} from "@/components/dashboard/todays-inbox";
import { RecentAchievements } from "@/components/dashboard/recent-achievements";
import { WeeklyChallenge } from "@/components/dashboard/weekly-challenge";
import { WelcomeConfetti } from "@/components/welcome-confetti";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getAllScenarios } from "@/lib/scenarios";
import { requireClientById } from "@/lib/clients";
import { emptySkillProgress, SKILLS, type SkillKey } from "@/lib/skills";
import { recommendTodaysInbox } from "@/lib/recommendations";
import { getWeeklyChallenge } from "@/lib/weekly-challenge";
import { BADGES } from "@/lib/badges";

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

  // First-time sign-in → onboarding.
  if (!user.onboardedAt) redirect("/onboarding");

  const completions = await prisma.scenarioCompletion.findMany({
    where: { userId: user.id },
    select: { scenarioId: true },
  });
  const completedIds = new Set(completions.map((c) => c.scenarioId));

  const skillProgress = coerceSkillProgress(user.skillProgress);
  const skillLevels: Partial<Record<SkillKey, number>> = {};
  for (const s of SKILLS) {
    skillLevels[s.key] = skillProgress[s.key]?.level ?? 0;
  }

  const recommended = recommendTodaysInbox({
    userLevel: user.level,
    skillLevels,
    completionsCount: completions.length,
    completedIds,
    scenarios: getAllScenarios(),
  });

  const inbox: InboxScenario[] = recommended.map((s) => {
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

  // Badges for the "Recent achievements" card — sorted by definition
  // order so rarity-highs surface at the bottom first, and we slice to
  // the latest three.
  const ownedBadgeIds = coerceBadges(user.badges);
  const ownedBadges = BADGES.filter((b) => ownedBadgeIds.includes(b.id));
  const achievements = ownedBadges.slice(-3).map((b) => ({
    id: b.id,
    name: b.name,
    earnedAtLabel: b.description,
  }));

  const challenge = getWeeklyChallenge();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <React.Suspense fallback={null}>
        <WelcomeConfetti />
      </React.Suspense>

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
        <RecentAchievements achievements={achievements} />
      </div>

      <WeeklyChallenge
        title={challenge.title}
        description={challenge.description}
        status="active"
      />
    </div>
  );
}
