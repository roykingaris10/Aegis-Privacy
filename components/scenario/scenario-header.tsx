"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScenarioTimer } from "./scenario-timer";
import type { Scenario } from "@/lib/scenarios";
import type { Client } from "@/lib/clients";
import { cn } from "@/lib/utils";

type Props = {
  scenario: Scenario;
  client: Client;
  timerRunning: boolean;
  onTick?: (elapsedSec: number) => void;
};

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "Tier I",
  2: "Tier II",
  3: "Tier III",
};

const TIER_STYLES: Record<1 | 2 | 3, string> = {
  1: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  2: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  3: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
};

export function ScenarioHeader({
  scenario,
  client,
  timerRunning,
  onTick,
}: Props): React.ReactElement {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6">
      <Link
        href="/inbox"
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Inbox
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold leading-tight">
          {scenario.title}
        </h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{client.name}</span>
          <span>·</span>
          <Badge
            variant="outline"
            className={cn("text-[10px]", TIER_STYLES[scenario.tier])}
          >
            {TIER_LABEL[scenario.tier]}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {humanSkill(scenario.skill)}
          </Badge>
        </div>
      </div>
      <ScenarioTimer running={timerRunning} onTick={onTick} />
    </header>
  );
}

function humanSkill(s: string): string {
  return s
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
