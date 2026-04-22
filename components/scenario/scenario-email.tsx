"use client";

import * as React from "react";
import { ChevronDown, FileText, Mail, Paperclip, Sparkles } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/scenarios";
import type { Client } from "@/lib/clients";

type Props = {
  scenario: Scenario;
  client: Client;
};

export function ScenarioEmail({ scenario, client }: Props): React.ReactElement {
  const [briefingOpen, setBriefingOpen] = React.useState(false);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-xs font-semibold"
            style={{
              backgroundColor: `${client.brandColour}1F`,
              borderColor: `${client.brandColour}40`,
              color: client.brandColour,
            }}
          >
            {client.logoInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{scenario.emailSender.name}</p>
            <p className="text-xs text-muted-foreground">
              {scenario.emailSender.role}
            </p>
            <p className="text-xs text-muted-foreground">
              &lt;{scenario.emailSender.email}&gt;
            </p>
          </div>
        </div>

        <h3 className="mt-4 text-base font-semibold leading-tight">
          {scenario.emailSubject}
        </h3>

        <Separator className="my-4" />

        <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground">
          {scenario.emailBody}
        </div>

        {scenario.supportingDocuments.length > 0 ? (
          <>
            <Separator className="my-5" />
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              Attachments ({scenario.supportingDocuments.length})
            </div>
            <ul className="mt-3 space-y-2">
              {scenario.supportingDocuments.map((doc) => (
                <Attachment key={doc.name} doc={doc} />
              ))}
            </ul>
          </>
        ) : null}

        <Separator className="my-5" />

        <button
          type="button"
          onClick={() => setBriefingOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-solid hover:bg-accent/50 hover:text-foreground"
          aria-expanded={briefingOpen}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {briefingOpen ? "Hide briefing" : "View briefing"}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              briefingOpen && "rotate-180",
            )}
          />
        </button>

        {briefingOpen ? (
          <div className="mt-3 space-y-4 rounded-lg border bg-muted/30 p-4 text-sm">
            <BriefingField
              label="Request type"
              value={scenario.briefing.requestType}
            />
            <BriefingField
              label="What you need to know"
              value={scenario.briefing.whatUserNeedsToKnow}
            />
            <BriefingField
              label="Common pitfalls"
              value={scenario.briefing.commonPitfalls}
              preformatted
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BriefingField({
  label,
  value,
  preformatted = false,
}: {
  label: string;
  value: string;
  preformatted?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm leading-relaxed text-foreground",
          preformatted && "whitespace-pre-wrap font-mono text-xs",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Attachment({
  doc,
}: {
  doc: {
    name: string;
    type: "pdf" | "image" | "email" | "document";
    excerpt?: string;
  };
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const Icon = doc.type === "email" ? Mail : FileText;

  return (
    <li className="overflow-hidden rounded-md border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 p-3 text-left transition-colors hover:bg-accent/30"
        aria-expanded={open}
        disabled={!doc.excerpt}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{doc.name}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {doc.type}
          </p>
        </div>
        {doc.excerpt ? (
          <ChevronDown
            className={cn(
              "mt-1 h-3.5 w-3.5 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        ) : null}
      </button>
      {open && doc.excerpt ? (
        <p className="border-t bg-muted/30 p-3 text-xs text-muted-foreground">
          {doc.excerpt}
        </p>
      ) : null}
    </li>
  );
}
