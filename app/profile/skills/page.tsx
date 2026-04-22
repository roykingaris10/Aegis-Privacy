import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProfileSubnav } from "@/components/profile/profile-subnav";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { emptySkillProgress, SKILLS, type SkillKey } from "@/lib/skills";
import { getSkillXpForLevel, MAX_SKILL_LEVEL } from "@/lib/xp";

export const dynamic = "force-dynamic";

function coerceSkillProgress(raw: unknown) {
  const base = emptySkillProgress();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const map = raw as Record<string, { level?: number; xp?: number }>;
  for (const s of SKILLS) {
    const e = map[s.key];
    if (e && typeof e.level === "number" && typeof e.xp === "number") {
      base[s.key] = { level: e.level, xp: e.xp };
    }
  }
  return base;
}

export default async function SkillsPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  const progress = coerceSkillProgress(user.skillProgress);

  const completions = await prisma.scenarioCompletion.findMany({
    where: { userId: user.id },
    include: { scenario: { select: { skill: true } } },
  });
  const countsBySkill = new Map<SkillKey, number>();
  for (const c of completions) {
    const k = c.scenario.skill as SkillKey;
    countsBySkill.set(k, (countsBySkill.get(k) ?? 0) + 1);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
        <p className="text-sm text-muted-foreground">
          Ten skill trees, each levels 0–{MAX_SKILL_LEVEL}. Each scenario you
          complete adds to the matching skill&apos;s XP.
        </p>
      </div>
      <ProfileSubnav />

      <div className="grid gap-4 md:grid-cols-2">
        {SKILLS.map((s) => {
          const entry = progress[s.key];
          const floor = getSkillXpForLevel(entry.level);
          const ceiling = getSkillXpForLevel(
            Math.min(entry.level + 1, MAX_SKILL_LEVEL),
          );
          const within =
            ceiling === floor
              ? 100
              : Math.round(((entry.xp - floor) / (ceiling - floor)) * 100);
          const count = countsBySkill.get(s.key) ?? 0;
          const untouched = entry.xp === 0 && count === 0;

          return (
            <Card key={s.key} className={untouched ? "opacity-70" : undefined}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} scenario{count === 1 ? "" : "s"} completed
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                    Lv {entry.level}
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-baseline justify-between text-[11px] text-muted-foreground">
                    <span>
                      <span className="tabular-nums text-foreground">
                        {entry.xp}
                      </span>{" "}
                      / {ceiling} XP
                    </span>
                    <span>
                      {entry.level >= MAX_SKILL_LEVEL
                        ? "Mastered"
                        : `${within}% to Lv ${entry.level + 1}`}
                    </span>
                  </div>
                  <Progress value={within} className="h-1.5" />
                </div>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="mt-1 self-start"
                >
                  <Link href={`/inbox?skill=${s.key}`}>
                    Practice this skill <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
