"use client";

import * as React from "react";

import { InboxFolderNav, type InboxFolder } from "./inbox-folder-nav";
import { InboxList } from "./inbox-list";
import { ScenarioReadingPane } from "./scenario-reading-pane";
import type { InboxScenario } from "./inbox-types";

type Props = {
  scenarios: ReadonlyArray<InboxScenario>;
};

export function InboxClient({ scenarios }: Props): React.ReactElement {
  const [folder, setFolder] = React.useState<InboxFolder>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    scenarios[0]?.id ?? null,
  );

  // Fold / Today / This Week all show the full list in Sprint 2a; the
  // grouping folders arrange the same list.
  const counts: Record<InboxFolder, number> = {
    all: scenarios.length,
    today: scenarios.length,
    this_week: scenarios.length,
    by_client: scenarios.length,
    by_skill: scenarios.length,
  };

  const grouping: "none" | "client" | "skill" =
    folder === "by_client"
      ? "client"
      : folder === "by_skill"
        ? "skill"
        : "none";

  const selected =
    scenarios.find((s) => s.id === selectedId) ?? scenarios[0] ?? null;

  // Mobile: show either the list or the reading pane, not both.
  const [mobileReading, setMobileReading] = React.useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileReading(true);
  };

  return (
    <div className="grid h-[calc(100vh-3.5rem-3rem)] grid-cols-1 overflow-hidden rounded-xl border md:grid-cols-[220px_360px_1fr]">
      {/* Folder nav — hidden on mobile */}
      <aside className="hidden border-r md:block">
        <InboxFolderNav value={folder} counts={counts} onChange={setFolder} />
      </aside>

      {/* Message list */}
      <section
        className={
          mobileReading
            ? "hidden border-r md:block md:overflow-y-auto"
            : "overflow-y-auto border-r"
        }
      >
        <InboxList
          scenarios={scenarios}
          selectedId={selectedId}
          grouping={grouping}
          onSelect={handleSelect}
        />
      </section>

      {/* Reading pane */}
      <section
        className={
          mobileReading ? "overflow-hidden" : "hidden overflow-hidden md:block"
        }
      >
        {selected ? (
          <ScenarioReadingPane
            scenario={selected}
            onBack={() => setMobileReading(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            Select a scenario to preview it here.
          </div>
        )}
      </section>
    </div>
  );
}
