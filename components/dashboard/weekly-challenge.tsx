import * as React from "react";
import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type WeeklyChallengeProps = {
  title: string;
  description?: string;
  status?: "upcoming" | "active" | "coming_soon";
};

const STATUS_LABEL: Record<
  NonNullable<WeeklyChallengeProps["status"]>,
  string
> = {
  upcoming: "Upcoming",
  active: "Active",
  coming_soon: "Coming soon",
};

export function WeeklyChallenge({
  title,
  description,
  status = "coming_soon",
}: WeeklyChallengeProps): React.ReactElement {
  return (
    <Card className="relative overflow-hidden border-dashed">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Weekly challenge
            </p>
            <Badge variant="secondary" className="text-[10px]">
              {STATUS_LABEL[status]}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-tight">{title}</p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
