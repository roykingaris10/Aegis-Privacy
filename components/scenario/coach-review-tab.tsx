"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Scenario } from "@/lib/scenarios";
import type { ReviewPayload } from "./review-types";

type Props = {
  scenario: Scenario;
  review: ReviewPayload | null;
  submitting: boolean;
};

export function CoachReviewTab({
  scenario,
  review,
  submitting,
}: Props): React.ReactElement {
  if (!review && submitting) return <ReviewLoading />;
  if (!review)
    return (
      <p className="text-sm text-muted-foreground">
        Submit your response to see the coach&apos;s review.
      </p>
    );

  return (
    <div className="space-y-5">
      {review.degraded ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            The coach couldn&apos;t generate full feedback this time — a
            placeholder review was saved. Your response is on file and you can
            re-submit later.
          </p>
        </div>
      ) : null}

      <HeadlineCard review={review} />

      <RubricBreakdown review={review} />

      <StrengthsAndGaps review={review} />

      <section>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Coach&apos;s review
        </p>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {review.narrative}
          </ReactMarkdown>
        </div>
      </section>

      <section>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          How the exemplar differs
        </p>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {review.exemplarCommentary}
          </ReactMarkdown>
        </div>
      </section>

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

function ReviewLoading(): React.ReactElement {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-4 text-sm">
      <div className="mt-0.5 flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <div>
        <p className="font-medium">Coach is reviewing your response.</p>
        <p className="text-xs text-muted-foreground">
          Usually 10–20 seconds. The rubric, strengths, gaps, narrative, and
          exemplar commentary all land together.
        </p>
      </div>
    </div>
  );
}

function HeadlineCard({
  review,
}: {
  review: ReviewPayload;
}): React.ReactElement {
  return (
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
  );
}

function RubricBreakdown({
  review,
}: {
  review: ReviewPayload;
}): React.ReactElement {
  return (
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
            {row.commentary ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {row.commentary}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StrengthsAndGaps({
  review,
}: {
  review: ReviewPayload;
}): React.ReactElement {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-md border p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Strengths
        </p>
        <ul className="space-y-1 text-sm">
          {review.strengths.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-emerald-600">+</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <XCircle className="h-3.5 w-3.5" />
          Gaps
        </p>
        <ul className="space-y-1 text-sm">
          {review.gaps.map((g, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-amber-600">—</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
