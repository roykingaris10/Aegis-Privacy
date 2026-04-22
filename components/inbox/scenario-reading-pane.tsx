"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Mail, Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { InboxScenario } from "./inbox-types";

type Props = {
  scenario: InboxScenario;
  onBack?: () => void;
};

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "Tier I · Starter",
  2: "Tier II · Mid-Market",
  3: "Tier III · Enterprise",
};

export function ScenarioReadingPane({
  scenario,
  onBack,
}: Props): React.ReactElement {
  return (
    <article className="flex h-full flex-col">
      <header className="flex items-start gap-4 border-b p-6">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-sm font-semibold"
          style={{
            backgroundColor: `${scenario.clientRecord.brandColour}1F`,
            borderColor: `${scenario.clientRecord.brandColour}40`,
            color: scenario.clientRecord.brandColour,
          }}
        >
          {scenario.clientRecord.logoInitials}
        </div>
        <div className="min-w-0 flex-1">
          {onBack ? (
            <button
              onClick={onBack}
              className="mb-1 text-xs text-muted-foreground underline-offset-2 hover:underline md:hidden"
            >
              ← Back to inbox
            </button>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">
              {TIER_LABEL[scenario.tier]}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {humanSkill(scenario.skill)}
            </Badge>
            <span>·</span>
            <span>{scenario.clientRecord.name}</span>
            <span>·</span>
            <span className="tabular-nums">
              +{scenario.xpBase} XP · {scenario.timeLimitMinutes} min
            </span>
          </div>
          <h2 className="mt-2 text-lg font-semibold leading-tight">
            {scenario.emailSubject}
          </h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-6">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <Label>From</Label>
            <Value>
              {scenario.emailSender.name} &lt;{scenario.emailSender.email}&gt;
              <div className="text-muted-foreground">
                {scenario.emailSender.role}
              </div>
            </Value>
            <Label>To</Label>
            <Value>advisory@aegisprivacy.partners</Value>
            <Label>Subject</Label>
            <Value>{scenario.emailSubject}</Value>
          </dl>

          <Separator className="my-5" />

          <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground">
            {scenario.emailBody}
          </div>

          {scenario.supportingDocuments.length > 0 ? (
            <>
              <Separator className="my-6" />
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" />
                Attachments ({scenario.supportingDocuments.length})
              </div>
              <ul className="mt-3 space-y-2">
                {scenario.supportingDocuments.map((doc) => (
                  <li
                    key={doc.name}
                    className="rounded-md border bg-muted/40 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <DocIcon type={doc.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {doc.name}
                        </p>
                        {doc.excerpt ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {doc.excerpt}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t bg-background p-4">
        <p className="text-xs text-muted-foreground">{scenario.userTask}</p>
        <Button asChild>
          <Link href={`/scenario/${scenario.id}`}>
            Start scenario
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </footer>
    </article>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <dt className="font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </dt>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return <dd className="text-foreground">{children}</dd>;
}

function DocIcon({
  type,
}: {
  type: "pdf" | "image" | "email" | "document";
}): React.ReactElement {
  if (type === "email") return <Mail className="mt-0.5 h-4 w-4 shrink-0" />;
  return <FileText className="mt-0.5 h-4 w-4 shrink-0" />;
}

function humanSkill(s: string): string {
  return s
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
