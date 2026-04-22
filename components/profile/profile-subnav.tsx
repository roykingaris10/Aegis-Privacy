"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS: Array<{ href: string; label: string }> = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/skills", label: "Skills" },
  { href: "/profile/badges", label: "Badges" },
];

export function ProfileSubnav(): React.ReactElement {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b">
      {ITEMS.map((item) => {
        const active =
          item.href === "/profile"
            ? pathname === "/profile"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
