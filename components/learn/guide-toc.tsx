"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TocItem = { id: string; text: string; level: number };

export function GuideToc({ source }: { source: string }) {
  const [activeId, setActiveId] = useState<string>("");

  // Parse headings from MDX source (## and ###).
  const headings = useMemo<TocItem[]>(() => {
    const items: TocItem[] = [];
    const lines = source.split("\n");
    for (const line of lines) {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[*_`]/g, "").trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        items.push({ id, text, level });
      }
    }
    return items;
  }, [source]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );

    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1 text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        On this page
      </p>
      {headings.map(({ id, text, level }) => (
        <a
          key={id}
          href={`#${id}`}
          className={cn(
            "block truncate py-1 text-slate-400 transition-colors hover:text-slate-200",
            level === 3 && "pl-4",
            activeId === id && "text-blue-400 font-medium",
          )}
        >
          {text}
        </a>
      ))}
    </nav>
  );
}
