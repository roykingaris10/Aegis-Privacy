import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type InboxScenario = {
  id: string;
  client: string;
  clientInitial: string;
  subject: string;
  preview: string;
  tier: 1 | 2 | 3;
  skillLabel: string;
  xpReward: number;
  deadlineLabel: string;
};

type TodaysInboxProps = {
  scenarios: ReadonlyArray<InboxScenario>;
};

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "Tier I · Starter",
  2: "Tier II · Mid-Market",
  3: "Tier III · Enterprise",
};

const TIER_STYLES: Record<1 | 2 | 3, string> = {
  1: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  2: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  3: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
};

export function TodaysInbox({
  scenarios,
}: TodaysInboxProps): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium">
            Today&apos;s inbox
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {scenarios.length} scenarios waiting
          </p>
        </div>
        <Link
          href="/inbox"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {scenarios.map((s) => (
          <ScenarioCard key={s.id} scenario={s} />
        ))}
      </CardContent>
    </Card>
  );
}

function ScenarioCard({
  scenario,
}: {
  scenario: InboxScenario;
}): React.ReactElement {
  return (
    <Link
      href={`/scenario/${scenario.id}`}
      className="group relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
            {scenario.clientInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">
              {scenario.client}
            </p>
            <p className="truncate text-sm font-semibold leading-tight">
              {scenario.subject}
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {scenario.preview}
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Badge
          variant="outline"
          className={cn("text-[10px]", TIER_STYLES[scenario.tier])}
        >
          {TIER_LABEL[scenario.tier]}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          {scenario.skillLabel}
        </Badge>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {scenario.deadlineLabel}
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-foreground">
          +{scenario.xpReward} XP
        </span>
      </div>
    </Link>
  );
}
