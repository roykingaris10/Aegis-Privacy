"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle } from "lucide-react";

import { streamBriefing } from "@/lib/coach-client";

type Props = {
  scenarioId: string;
  /** Fallback content to render if streaming fails or key is missing. */
  briefingNotes: {
    requestType: string;
    whatUserNeedsToKnow: string;
    commonPitfalls: string;
  };
};

type Status = "idle" | "streaming" | "done" | "error" | "offline";

export function CoachBriefingTab({
  scenarioId,
  briefingNotes,
}: Props): React.ReactElement {
  const [text, setText] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const controller = new AbortController();
    setStatus("streaming");
    streamBriefing(
      scenarioId,
      {
        onDelta: (accum) => setText(accum),
        onDone: () => setStatus("done"),
        onError: (message, code) => {
          setErrorMessage(message);
          setStatus(code === "coach_offline" ? "offline" : "error");
        },
      },
      controller.signal,
    ).catch((err: unknown) => {
      if ((err as { name?: string })?.name === "AbortError") return;
      setErrorMessage((err as Error).message ?? "Streaming failed");
      setStatus("error");
    });
    return () => controller.abort();
  }, [scenarioId]);

  if (status === "offline" || status === "error") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">
              {status === "offline"
                ? "Coach is offline"
                : "Coach briefing failed"}
            </p>
            <p className="text-xs opacity-90">{errorMessage}</p>
            <p className="mt-2 text-xs opacity-75">
              Raw briefing notes shown below.
            </p>
          </div>
        </div>
        <RawBriefing notes={briefingNotes} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
      {status === "streaming" ? <TypingIndicator /> : null}
    </div>
  );
}

function TypingIndicator(): React.ReactElement {
  return (
    <div
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      aria-live="polite"
    >
      <span className="inline-flex gap-0.5">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </span>
      Coach is briefing you…
    </div>
  );
}

function Dot({ delay }: { delay: string }): React.ReactElement {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
      style={{ animationDelay: delay }}
    />
  );
}

function RawBriefing({
  notes,
}: {
  notes: Props["briefingNotes"];
}): React.ReactElement {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <Field label="Request type">{notes.requestType}</Field>
      <Field label="What you need to know">{notes.whatUserNeedsToKnow}</Field>
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Common pitfalls
        </p>
        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
          {notes.commonPitfalls}
        </pre>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{children}</p>
    </div>
  );
}
