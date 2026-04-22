"use client";

import * as React from "react";
import { ChevronUp, Lightbulb, ScrollText, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/scenarios";
import type { ReviewPayload } from "./review-types";

type Tab = "briefing" | "hint" | "review";

type Props = {
  scenario: Scenario;
  review: ReviewPayload | null;
  submitting: boolean;
};

const HINT_STUB =
  "Sprint 2b will connect me to a real mentor. For now, re-read the briefing — every criterion in the rubric is covered by something in it.";

export function CoachPanel({
  scenario,
  review,
  submitting,
}: Props): React.ReactElement {
  const [expanded, setExpanded] = React.useState(true);
  const [tab, setTab] = React.useState<Tab>("briefing");

  // Jump to Review as soon as one arrives.
  React.useEffect(() => {
    if (review) {
      setTab("review");
      setExpanded(true);
    }
  }, [review]);

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
            >
              Hint
            </TabButton>
            {review ? (
              <TabButton
                active={tab === "review"}
                onClick={() => setTab("review")}
                icon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Review
              </TabButton>
            ) : null}
          </div>

          <div className="max-h-[40vh] overflow-y-auto px-5 py-4">
            {tab === "briefing" ? <BriefingTab scenario={scenario} /> : null}
            {tab === "hint" ? <HintTab /> : null}
            {tab === "review" && review ? (
              <ReviewTab scenario={scenario} review={review} />
            ) : null}
            {tab === "review" && !review && submitting ? (
              <p className="text-sm text-muted-foreground">
                Processing your response…
              </p>
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
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px flex items-center gap-1.5 rounded-t-md border-x border-t px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-border bg-background text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function BriefingTab({ scenario }: { scenario: Scenario }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <Field label="Request type">{scenario.briefing.requestType}</Field>
      <Field label="What you need to know">
        {scenario.briefing.whatUserNeedsToKnow}
      </Field>
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Common pitfalls
        </p>
        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
          {scenario.briefing.commonPitfalls}
        </pre>
      </div>
    </div>
  );
}

function HintTab() {
  return (
    <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
      <p>{HINT_STUB}</p>
    </div>
  );
}

function ReviewTab({
  scenario,
  review,
}: {
  scenario: Scenario;
  review: ReviewPayload;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Overall score
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums">
            {review.overallScore}
            <span className="text-sm font-normal text-muted-foreground">
              /100
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            XP earned
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums">
            +{review.xp.total}
          </p>
          <p className="text-[11px] text-muted-foreground">
            base {review.xp.base} · quality ×
            {review.xp.qualityMultiplier.toFixed(2)} · streak ×
            {review.xp.streakMultiplier.toFixed(2)}
            {review.xp.firstTimeMultiplier > 1 ? " · first-time ×1.25" : ""}
            {review.xp.perfectScoreBonus > 0
              ? ` · +${review.xp.perfectScoreBonus} perfect`
              : ""}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Rubric breakdown
        </p>
        <ul className="space-y-2">
          {review.rubricScores.map((row) => (
            <li key={row.criterion} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{row.criterion}</p>
                <Badge variant="secondary" className="tabular-nums text-[10px]">
                  {row.score}/{row.maxPoints}
                </Badge>
              </div>
              <Progress
                value={Math.round((row.score / row.maxPoints) * 100)}
                className="mt-2 h-1.5"
              />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Narrative
        </p>
        <p className="text-sm leading-relaxed text-foreground">
          {review.narrative}
        </p>
      </div>

      <details className="rounded-md border bg-muted/20 p-3 text-sm">
        <summary className="cursor-pointer font-medium">
          Exemplar response
        </summary>
        <div className="mt-2 whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground">
          {scenario.exemplarResponse}
        </div>
      </details>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{children}</p>
    </div>
  );
}
