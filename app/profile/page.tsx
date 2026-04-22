import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSubnav } from "@/components/profile/profile-subnav";
import { ProfileActivityCalendar } from "@/components/profile/activity-calendar";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getTitleForLevel } from "@/lib/xp";

export const dynamic = "force-dynamic";

const SPECIALISM_LABELS: Record<string, string> = {
  data_protection: "Data Protection",
  information_governance: "Information Governance",
  privacy_engineering: "Privacy Engineering",
  ai_governance: "AI Governance",
};

function coerceGoals(raw: unknown): string[] {
  return Array.isArray(raw)
    ? (raw.filter((g) => typeof g === "string") as string[])
    : [];
}

function dayKey(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function buildCalendarData(
  completions: Array<{ completedAt: Date; xpEarned: number }>,
): { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] {
  // Last 90 days, inclusive of today.
  const days: Record<string, number> = {};
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    days[dayKey(d)] = 0;
  }
  for (const c of completions) {
    const key = dayKey(c.completedAt);
    if (key in days) days[key] += c.xpEarned;
  }
  const max = Math.max(1, ...Object.values(days));
  const levelFor = (xp: number): 0 | 1 | 2 | 3 | 4 => {
    if (xp === 0) return 0;
    const pct = xp / max;
    if (pct > 0.75) return 4;
    if (pct > 0.5) return 3;
    if (pct > 0.25) return 2;
    return 1;
  };
  return Object.entries(days).map(([date, count]) => ({
    date,
    count,
    level: levelFor(count),
  }));
}

export default async function ProfileOverviewPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  const completions = await prisma.scenarioCompletion.findMany({
    where: { userId: user.id },
    select: { completedAt: true, xpEarned: true, score: true },
    orderBy: { completedAt: "desc" },
  });
  const avgScore =
    completions.length > 0
      ? Math.round(
          completions.reduce((s, c) => s + c.score, 0) / completions.length,
        )
      : 0;

  const goals = coerceGoals(user.goals);
  const calendarData = buildCalendarData(completions);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {user.name ?? user.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          Level {user.level} · {getTitleForLevel(user.level)} ·{" "}
          {SPECIALISM_LABELS[user.specialism ?? ""] ?? "Data Protection"}
        </p>
      </div>

      <ProfileSubnav />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Scenarios" value={completions.length.toString()} />
        <StatCard label="Avg score" value={`${avgScore}/100`} />
        <StatCard label="Total XP" value={user.totalXp.toLocaleString()} />
        <StatCard label="Longest streak" value={`${user.longestStreak} days`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Last 90 days · XP by day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileActivityCalendar data={calendarData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Row label="Email" value={user.email} />
          <Row
            label="Specialism"
            value={
              SPECIALISM_LABELS[user.specialism ?? ""] ?? user.specialism ?? "—"
            }
          />
          <Row
            label="Goals"
            value={goals.length > 0 ? goals.join(", ") : "—"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}
