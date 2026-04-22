"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InboxScenario } from "./inbox-types";

type Props = {
  scenarios: ReadonlyArray<InboxScenario>;
  selectedId: string | null;
  grouping: "none" | "client" | "skill";
  onSelect: (id: string) => void;
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

export function InboxList({
  scenarios,
  selectedId,
  grouping,
  onSelect,
}: Props): React.ReactElement {
  const groups = React.useMemo(
    () => groupScenarios(scenarios, grouping),
    [scenarios, grouping],
  );

  if (scenarios.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        No scenarios in this folder.
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {groups.map((group) => (
        <React.Fragment key={group.label}>
          {group.label ? (
            <li className="bg-muted/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </li>
          ) : null}
          {group.items.map((s) => (
            <InboxRow
              key={s.id}
              scenario={s}
              active={s.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </React.Fragment>
      ))}
    </ul>
  );
}

type Group = { label: string; items: ReadonlyArray<InboxScenario> };

function groupScenarios(
  scenarios: ReadonlyArray<InboxScenario>,
  grouping: Props["grouping"],
): Group[] {
  if (grouping === "none") return [{ label: "", items: scenarios }];
  const map = new Map<string, InboxScenario[]>();
  for (const s of scenarios) {
    const key =
      grouping === "client" ? s.clientRecord.name : skillLabel(s.skill);
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({ label, items }));
}

function skillLabel(skill: string): string {
  return skill
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function InboxRow({
  scenario,
  active,
  onSelect,
}: {
  scenario: InboxScenario;
  active: boolean;
  onSelect: (id: string) => void;
}): React.ReactElement {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(scenario.id)}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
          active ? "bg-accent" : "hover:bg-accent/40",
        )}
      >
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold"
          style={{
            backgroundColor: `${scenario.clientRecord.brandColour}18`,
            borderColor: `${scenario.clientRecord.brandColour}40`,
            color: scenario.clientRecord.brandColour,
          }}
        >
          {scenario.clientRecord.logoInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-muted-foreground">
              {scenario.emailSender.name}
            </span>
            <span className="shrink-0 tabular-nums text-[11px] font-semibold text-foreground">
              +{scenario.xpBase} XP
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">
            {scenario.emailSubject}
          </p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {scenario.briefing.requestType}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn("text-[10px]", TIER_STYLES[scenario.tier])}
            >
              {TIER_LABEL[scenario.tier]}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {skillLabel(scenario.skill)}
            </Badge>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {scenario.timeLimitMinutes} min
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}
