"use client";

import * as React from "react";
import {
  Inbox as InboxIcon,
  Calendar,
  CalendarDays,
  Building2,
  Layers,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type InboxFolder =
  | "all"
  | "today"
  | "this_week"
  | "by_client"
  | "by_skill";

const FOLDERS: ReadonlyArray<{
  key: InboxFolder;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "all", label: "All", icon: InboxIcon },
  { key: "today", label: "Today", icon: Calendar },
  { key: "this_week", label: "This week", icon: CalendarDays },
  { key: "by_client", label: "By client", icon: Building2 },
  { key: "by_skill", label: "By skill", icon: Layers },
];

type Props = {
  value: InboxFolder;
  counts: Record<InboxFolder, number>;
  onChange: (next: InboxFolder) => void;
};

export function InboxFolderNav({
  value,
  counts,
  onChange,
}: Props): React.ReactElement {
  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {FOLDERS.map(({ key, label, icon: Icon }) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            <span className="tabular-nums text-xs text-muted-foreground">
              {counts[key]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
