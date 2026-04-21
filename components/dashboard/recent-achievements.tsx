import * as React from "react";
import { Award } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Achievement = {
  id: string;
  name: string;
  earnedAtLabel: string;
};

type RecentAchievementsProps = {
  achievements: ReadonlyArray<Achievement>;
};

export function RecentAchievements({
  achievements,
}: RecentAchievementsProps): React.ReactElement {
  const isEmpty = achievements.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Recent achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Award className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">
              Complete your first scenario to earn your first badge.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {achievements.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Award className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.earnedAtLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
