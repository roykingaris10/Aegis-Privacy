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
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-secondary text-2xl font-semibold tabular-nums">
            {progress.level}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Level {progress.level}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold leading-tight">
              {progress.title}
            </h2>
          </div>
        </div>

        <div className="w-full sm:w-80">
          <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
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
