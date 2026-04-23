import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { levelProgress } from "@/lib/xp";

type LevelBannerProps = {
  totalXp: number;
  level: number;
};

export function LevelBanner({
  totalXp,
  level,
}: LevelBannerProps): React.ReactElement {
  const progress = levelProgress(totalXp, level);

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-secondary text-2xl font-semibold tabular-nums">
            {progress.level}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Level {progress.level}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold leading-tight">
              {progress.title}
            </h2>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-80">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-muted-foreground">
            <span>
              <span className="tabular-nums text-foreground">
                {progress.xpIntoLevel.toLocaleString()}
              </span>{" "}
              /{" "}
              <span className="tabular-nums">
                {progress.xpNeededForLevel.toLocaleString()} XP
              </span>
            </span>
            <span className="tabular-nums">
              {progress.percent}% to L{progress.level + 1}
            </span>
          </div>
          <Progress value={progress.percent} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
