import * as React from "react";
import { Flame } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type StreakCounterProps = {
  currentStreak: number;
  longestStreak?: number;
};

export function StreakCounter({
  currentStreak,
  longestStreak,
}: StreakCounterProps): React.ReactElement {
  const isActive = currentStreak > 0;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div
          className={
            isActive
              ? "flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500"
              : "flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          }
          aria-hidden
        >
          <Flame className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Streak
          </p>
          <p className="mt-0.5 text-lg font-semibold leading-tight">
            <span className="tabular-nums">{currentStreak}</span>-day streak
          </p>
          {longestStreak !== undefined && longestStreak > 0 ? (
            <p className="text-xs text-muted-foreground">
              Longest:{" "}
              <span className="tabular-nums text-foreground">
                {longestStreak}
              </span>{" "}
              days
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Start a streak today
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
