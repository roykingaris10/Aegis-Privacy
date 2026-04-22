"use client";

import * as React from "react";
import { ChevronUp, Lightbulb, ScrollText, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/scenarios";
import type { ReviewPayload } from "./review-types";
import { CoachBriefingTab } from "./coach-briefing-tab";
import { CoachHintTab } from "./coach-hint-tab";
import { CoachReviewTab } from "./coach-review-tab";

type Tab = "briefing" | "hint" | "review";

type Props = {
  scenario: Scenario;
  review: ReviewPayload | null;
  submitting: boolean;
  getCurrentDraft: () => string;
};

export function CoachPanel({
  scenario,
  review,
  submitting,
  getCurrentDraft,
}: Props): React.ReactElement {
  const [expanded, setExpanded] = React.useState(true);
  const [tab, setTab] = React.useState<Tab>("briefing");

  React.useEffect(() => {
    if (review || submitting) {
      setTab("review");
      setExpanded(true);
    }
  }, [review, submitting]);

  return (
    <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-2.5 text-left transition-colors hover:bg-accent/30"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          Coach
          <span className="text-muted-foreground">
            ·{" "}
            {tab === "briefing"
              ? "Briefing"
              : tab === "hint"
                ? "Hint"
                : "Review"}
          </span>
        </span>
        <ChevronUp
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            !expanded && "rotate-180",
          )}
        />
      </button>

      {expanded ? (
        <div className="border-t">
          <div className="flex gap-1 border-b bg-muted/30 px-4 pt-2">
            <TabButton
              active={tab === "briefing"}
              onClick={() => setTab("briefing")}
              icon={<ScrollText className="h-3.5 w-3.5" />}
            >
              Briefing
            </TabButton>
            <TabButton
              active={tab === "hint"}
              onClick={() => setTab("hint")}
              icon={<Lightbulb className="h-3.5 w-3.5" />}
              disabled={review !== null}
            >
              Hint
            </TabButton>
            {review || submitting ? (
              <TabButton
                active={tab === "review"}
                onClick={() => setTab("review")}
                icon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Review
              </TabButton>
            ) : null}
          </div>

          <div className="max-h-[44vh] overflow-y-auto px-5 py-4">
            {tab === "briefing" ? (
              <CoachBriefingTab
                scenarioId={scenario.id}
                briefingNotes={scenario.briefing}
              />
            ) : null}
            {tab === "hint" ? (
              <CoachHintTab
                scenarioId={scenario.id}
                getCurrentDraft={getCurrentDraft}
              />
            ) : null}
            {tab === "review" ? (
              <CoachReviewTab
                scenario={scenario}
                review={review}
                submitting={submitting}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "-mb-px flex items-center gap-1.5 rounded-t-md border-x border-t px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-border bg-background text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
