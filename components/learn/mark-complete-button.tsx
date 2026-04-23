"use client";

import { useState } from "react";
import { BookCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarkCompleteButton({
  guideSlug,
  initialCompleted,
}: {
  guideSlug: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (completed || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/guides/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideSlug }),
      });
      if (res.ok) setCompleted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={completed || loading}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        completed
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default"
          : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700",
      )}
    >
      <BookCheck className="h-4 w-4" />
      {completed ? "Completed" : loading ? "Saving…" : "Mark as read"}
    </button>
  );
}
