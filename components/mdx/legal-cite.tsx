"use client";

import { Scale } from "lucide-react";

export function LegalCite({
  provision,
  children,
}: {
  provision: string;
  children?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-xs font-medium text-slate-300">
      <Scale className="h-3 w-3 shrink-0 text-slate-400" />
      <span className="font-mono">{provision}</span>
      {children && <span className="text-slate-400"> — {children}</span>}
    </span>
  );
}
