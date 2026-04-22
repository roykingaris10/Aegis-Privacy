"use client";

import * as React from "react";
import { AlertCircle, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  scenarioId: string;
  getCurrentDraft: () => string;
};

const MAX_HINTS = 3;

type Status = "idle" | "loading" | "shown" | "error" | "offline";

type HintEntry = { id: number; text: string };

export function CoachHintTab({
  scenarioId,
  getCurrentDraft,
}: Props): React.ReactElement {
  const [hints, setHints] = React.useState<HintEntry[]>([]);
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const hintsLeft = MAX_HINTS - hints.length;

  async function requestHint(): Promise<void> {
    if (hintsLeft <= 0) return;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/coach/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          currentDraft: getCurrentDraft(),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        hint?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok || !body.hint) {
        setErrorMessage(body.error ?? "Couldn't fetch a hint");
        setStatus(body.code === "coach_offline" ? "offline" : "error");
        return;
      }
      setHints((prev) => [
        ...prev,
        { id: Date.now(), text: body.hint as string },
      ]);
      setStatus("shown");
    } catch (err) {
      setErrorMessage((err as Error).message);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="text-sm">
            <p className="font-medium">Stuck?</p>
            <p className="text-xs text-muted-foreground">
              The coach will give you a Socratic hint — a question to point you
              at what you&apos;re missing. {hintsLeft} of {MAX_HINTS} left.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={requestHint}
          disabled={hintsLeft === 0 || status === "loading"}
        >
          {status === "loading" ? "Thinking…" : "Give me a hint"}
        </Button>
      </div>

      {status === "offline" || status === "error" ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">
              {status === "offline" ? "Coach is offline" : "Hint failed"}
            </p>
            <p className="text-xs opacity-90">{errorMessage}</p>
          </div>
        </div>
      ) : null}

      {hints.length > 0 ? (
        <ol className="space-y-2">
          {hints.map((h, i) => (
            <li
              key={h.id}
              className="rounded-md border bg-background p-3 text-sm leading-relaxed"
            >
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Hint {i + 1}
              </p>
              {h.text}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-muted-foreground">No hints requested yet.</p>
      )}
    </div>
  );
}
