"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ScenarioHeader } from "./scenario-header";
import { ScenarioEmail } from "./scenario-email";
import { ResponseEditor, MAX_RESPONSE_CHARS } from "./response-editor";
import { CoachPanel } from "./coach-panel";
import type { ReviewPayload } from "./review-types";
import type { Scenario } from "@/lib/scenarios";
import type { Client } from "@/lib/clients";

type Props = {
  scenario: Scenario;
  client: Client;
};

export function ScenarioWorkspace({
  scenario,
  client,
}: Props): React.ReactElement {
  const [timerRunning, setTimerRunning] = React.useState(true);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [review, setReview] = React.useState<ReviewPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const draftRef = React.useRef("");

  const handleTick = React.useCallback((sec: number) => {
    setElapsedSec(sec);
  }, []);

  const handleDraftChange = React.useCallback((text: string) => {
    draftRef.current = text;
  }, []);
  const getCurrentDraft = React.useCallback(() => draftRef.current, []);

  const handleSubmit = async (html: string, text: string) => {
    if (text.length > MAX_RESPONSE_CHARS) {
      setError(
        `Response is over the ${MAX_RESPONSE_CHARS.toLocaleString()}-character limit — trim it down and resubmit.`,
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    setTimerRunning(false);
    try {
      const res = await fetch("/api/coach/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          userAnswer: html,
          userAnswerText: text,
          timeSpentSec: elapsedSec,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        throw new Error(
          body.error ??
            (body.code === "coach_offline"
              ? "Coach is offline — check your API key."
              : body.code === "rate_limited"
                ? "Daily coach limit reached. Try again tomorrow."
                : "Submission failed"),
        );
      }
      const payload = (await res.json()) as ReviewPayload;
      setReview(payload);
    } catch (err) {
      setError((err as Error).message);
      setTimerRunning(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="-m-6 flex min-h-[calc(100vh-3.5rem)] flex-col">
      <ScenarioHeader
        scenario={scenario}
        client={client}
        timerRunning={timerRunning}
        onTick={handleTick}
      />

      {error ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-6 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 md:divide-x">
        <div className="border-b md:border-b-0">
          <ScenarioEmail scenario={scenario} client={client} />
        </div>
        <div className="flex flex-col">
          <ResponseEditor
            disabled={review !== null}
            submitting={submitting}
            userTask={scenario.userTask}
            onSubmit={handleSubmit}
            onDraftChange={handleDraftChange}
          />
        </div>
      </div>

      {review ? (
        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Response saved. Coach review is below.
          </p>
          {review.nextScenarioId ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/scenario/${review.nextScenarioId}`}>
                Next scenario →
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/inbox">Back to inbox</Link>
            </Button>
          )}
        </div>
      ) : null}

      <CoachPanel
        scenario={scenario}
        review={review}
        submitting={submitting}
        getCurrentDraft={getCurrentDraft}
      />
    </div>
  );
}
