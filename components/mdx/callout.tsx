"use client";

import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Info,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

type CalloutType = "tip" | "warning" | "info";

const config: Record<CalloutType, { icon: LucideIcon; className: string }> = {
  tip: {
    icon: Lightbulb,
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  info: {
    icon: Info,
    className: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  },
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, className } = config[type];
  return (
    <div
      className={cn(
        "my-6 rounded-lg border p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          {title && (
            <p className="mb-1 font-semibold">{title}</p>
          )}
          <div className="text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
