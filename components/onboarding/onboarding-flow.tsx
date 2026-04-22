"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Specialism =
  | "data_protection"
  | "information_governance"
  | "privacy_engineering"
  | "ai_governance";

const SPECIALISMS: Array<{
  key: Specialism;
  label: string;
  blurb: string;
  disabled?: boolean;
}> = [
  {
    key: "data_protection",
    label: "Data Protection",
    blurb:
      "UK GDPR, DPA 2018, SARs, DPIAs, breaches. The core of the platform.",
  },
  {
    key: "information_governance",
    label: "Information Governance",
    blurb:
      "FOI, records management, retention, public-sector frameworks. Tier 2 focus.",
  },
  {
    key: "privacy_engineering",
    label: "Privacy Engineering",
    blurb:
      "Technical controls, data minimisation in systems, DPIA sign-off on tooling.",
  },
  {
    key: "ai_governance",
    label: "AI Governance",
    blurb: "Article 22, EU AI Act, automated decision-making, model risk.",
  },
];

const GOAL_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "bcs_practitioner", label: "Preparing for BCS Practitioner" },
  { key: "cipp_e", label: "Preparing for CIPP/E" },
  { key: "cipp_uk", label: "Preparing for CIPP/UK" },
  { key: "senior_dpo", label: "Building experience for a Senior DPO role" },
  { key: "refresh", label: "Refreshing my knowledge" },
  { key: "curious", label: "Just curious" },
];

type Step = 1 | 2 | 3;

export function OnboardingFlow({
  userName,
}: {
  userName: string | null;
}): React.ReactElement {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(1);
  const [specialism, setSpecialism] =
    React.useState<Specialism>("data_protection");
  const [goals, setGoals] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggleGoal(key: string) {
    setGoals((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key],
    );
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialism, goals }),
      });
      if (!res.ok) throw new Error("Couldn't save onboarding");
      router.push("/?welcome=1");
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6" />
        <span className="text-lg font-semibold tracking-tight">Aegis</span>
      </div>

      <StepDots current={step} />

      <div className="mt-6 w-full rounded-xl border bg-card p-8 shadow-sm">
        {step === 1 ? (
          <StepOne userName={userName} onNext={() => setStep(2)} />
        ) : null}
        {step === 2 ? (
          <StepTwo
            value={specialism}
            onChange={setSpecialism}
            onNext={() => setStep(3)}
          />
        ) : null}
        {step === 3 ? (
          <StepThree
            selected={goals}
            onToggle={toggleGoal}
            onFinish={finish}
            submitting={submitting}
            error={error}
          />
        ) : null}
      </div>
    </div>
  );
}

function StepDots({ current }: { current: Step }): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn(
            "h-1.5 w-6 rounded-full transition-colors",
            n <= current ? "bg-foreground" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}

function StepOne({
  userName,
  onNext,
}: {
  userName: string | null;
  onNext: () => void;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Welcome
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {userName ? `Good to have you, ${userName}.` : "Welcome to Aegis."}
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        You&apos;re joining <strong>Aegis Privacy Partners</strong> as a Data
        Protection trainee. We&apos;ll brief you before each client request,
        you&apos;ll draft your response, and we&apos;ll review it with you
        afterwards — just like a real graduate scheme at a top DP consultancy.
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Three quick questions before we hand you your first case.
      </p>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext}>
          Get started <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepTwo({
  value,
  onChange,
  onNext,
}: {
  value: Specialism;
  onChange: (v: Specialism) => void;
  onNext: () => void;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Step 2 of 3
      </p>
      <h2 className="text-xl font-semibold tracking-tight">Your specialism</h2>
      <p className="text-sm text-muted-foreground">
        This shapes which scenarios land in your inbox first. You can mix across
        specialisms anytime.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {SPECIALISMS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => !s.disabled && onChange(s.key)}
            disabled={s.disabled}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
              value === s.key
                ? "border-primary bg-accent/40"
                : "hover:bg-accent/20",
              s.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span className="text-sm font-semibold">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.blurb}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepThree({
  selected,
  onToggle,
  onFinish,
  submitting,
  error,
}: {
  selected: string[];
  onToggle: (k: string) => void;
  onFinish: () => void;
  submitting: boolean;
  error: string | null;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Step 3 of 3
      </p>
      <h2 className="text-xl font-semibold tracking-tight">
        What brings you to Aegis?
      </h2>
      <p className="text-sm text-muted-foreground">Pick as many as apply.</p>
      <div className="space-y-2">
        {GOAL_OPTIONS.map((g) => {
          const active = selected.includes(g.key);
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => onToggle(g.key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors",
                active ? "border-primary bg-accent/40" : "hover:bg-accent/20",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40",
                )}
              >
                {active ? "✓" : ""}
              </span>
              {g.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex justify-end pt-2">
        <Button onClick={onFinish} disabled={submitting}>
          {submitting ? "Saving…" : "Start training"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
