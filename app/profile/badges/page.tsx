import * as React from "react";
import { icons } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ProfileSubnav } from "@/components/profile/profile-subnav";

import { getCurrentUser } from "@/lib/current-user";
import { BADGES, type BadgeRarity } from "@/lib/badges";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RARITY_STYLES: Record<BadgeRarity, string> = {
  common:
    "border-slate-500/30 bg-slate-500/5 text-slate-700 dark:text-slate-300",
  uncommon:
    "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  rare: "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300",
  legendary:
    "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300",
};

const RARITY_LABEL: Record<BadgeRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

function coerceBadges(raw: unknown): string[] {
  return Array.isArray(raw)
    ? (raw.filter((b) => typeof b === "string") as string[])
    : [];
}

export default async function BadgesPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  const owned = new Set(coerceBadges(user.badges));

  const earnedCount = BADGES.filter((b) => owned.has(b.id)).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Badges</h1>
        <p className="text-sm text-muted-foreground">
          {earnedCount} of {BADGES.length} earned. Locked badges show the
          criteria so you know what to chase.
        </p>
      </div>
      <ProfileSubnav />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((b) => {
          const unlocked = owned.has(b.id);
          const LucideIcon =
            (
              icons as Record<
                string,
                React.ComponentType<{ className?: string }>
              >
            )[b.icon] ?? icons.Award;
          return (
            <Card
              key={b.id}
              className={cn(
                "relative overflow-hidden",
                !unlocked && "opacity-60",
              )}
            >
              <CardContent className="flex gap-3 p-4">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
                    unlocked
                      ? RARITY_STYLES[b.rarity]
                      : "border-dashed bg-muted/40 text-muted-foreground",
                  )}
                >
                  <LucideIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{b.name}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {RARITY_LABEL[b.rarity]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.description}
                  </p>
                  {!unlocked ? (
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Locked
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
